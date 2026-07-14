-- Hand-adjusted: db diff emitted a drop/recreate of device_loan_status with
-- an unchanged definition — but recreating it would silently lose the view's
-- `security_invoker = on` option and its grants (DROP discards them; default
-- privileges then re-grant to anon), letting anon bypass RLS through the
-- view. The view is untouched by this migration, so both statements were
-- removed.

alter table "public"."devices" add constraint "devices_type_quantity_check" CHECK (((type = 'accessory'::public.device_type) OR (quantity <= 1))) not valid;

alter table "public"."devices" validate constraint "devices_type_quantity_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION private.enforce_device_stock_floor()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_on_loan int;
begin
  if new.quantity >= old.quantity
     or current_setting('app.check_in', true) = '1' then
    return new;
  end if;

  select coalesce(sum(c.quantity - coalesce(ci.taken, 0)), 0)
    into v_on_loan
  from public.checkouts c
  left join (
    select checkout_id, sum(quantity) as taken
    from public.checkins group by checkout_id
  ) ci on ci.checkout_id = c.id
  where c.device_id = new.id;

  if new.quantity < v_on_loan then
    raise exception
      'quantity % is below the % units still out on loan',
      new.quantity, v_on_loan
      using errcode = 'P0001';
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION private.sync_device_checkout_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_ids     uuid[];
  v_id      uuid;
  v_on_loan int;
begin
  -- affected device(s): checkouts rows carry device_id directly (an UPDATE
  -- that re-targets frees the old device too); checkins resolve via their
  -- checkout
  if tg_table_name = 'checkouts' then
    select array_agg(distinct d) into v_ids
    from unnest(array[new.device_id, old.device_id]) as d
    where d is not null;
  else
    select array_agg(device_id) into v_ids
    from public.checkouts
    where id = coalesce(new.checkout_id, old.checkout_id);
  end if;

  foreach v_id in array coalesce(v_ids, array[]::uuid[]) loop
    select coalesce(sum(c.quantity - coalesce(ci.taken, 0)), 0)
      into v_on_loan
    from public.checkouts c
    left join (
      select checkout_id, sum(quantity) as taken
      from public.checkins group by checkout_id
    ) ci on ci.checkout_id = c.id
    where c.device_id = v_id;

    -- separate no-op-unless-needed updates so unchanged devices emit no
    -- update trigger noise (activity log listens on devices)
    update public.devices
       set status = 'checked_out'
     where id = v_id and status = 'storage'
       and v_on_loan > 0 and quantity - v_on_loan <= 0;

    update public.devices
       set status = 'storage'
     where id = v_id and status = 'checked_out'
       and (quantity - v_on_loan > 0 or v_on_loan = 0);
  end loop;

  return coalesce(new, old);
end;
$function$
;

CREATE OR REPLACE FUNCTION private.enforce_checkout_availability()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_total   int;
  v_status  public.device_status;
  v_on_loan int;
begin
  -- lock the device row: two concurrent checkouts on the same device must
  -- serialize here, or both could pass the availability math below
  select quantity, status into v_total, v_status
  from public.devices where id = new.device_id for update;

  -- storage-only policy for NEW loans (or re-targeting an existing one);
  -- editing an existing checkout must not trip on the status its own loan
  -- caused (a fully-loaned device is 'checked_out').
  if (tg_op = 'INSERT' or new.device_id <> old.device_id)
     and v_status <> 'storage' then
    raise exception
      'device is % and cannot be checked out', v_status
      using errcode = 'P0001';
  end if;

  select coalesce(sum(c.quantity - coalesce(ci.taken, 0)), 0)
    into v_on_loan
  from public.checkouts c
  left join (
    select checkout_id, sum(quantity) as taken
    from public.checkins group by checkout_id
  ) ci on ci.checkout_id = c.id
  where c.device_id = new.device_id
    and c.id <> new.id;

  if new.quantity + v_on_loan > v_total then
    raise exception
      'checkout of % exceeds available (% owned, % already out)',
      new.quantity, v_total, v_on_loan
      using errcode = 'P0001';
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.check_in(p_checkout_id uuid, p_outcome public.checkin_outcome, p_quantity integer, p_condition integer DEFAULT NULL::integer, p_photos jsonb DEFAULT '[]'::jsonb, p_notes text DEFAULT NULL::text, p_split boolean DEFAULT false, p_split_code text DEFAULT NULL::text)
 RETURNS public.checkins
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_device_id   uuid;
  v_device_qty  int;
  v_device_type public.device_type;
  v_lent        int;
  v_taken       int;
  v_outstanding int;
  v_new_device  uuid;
  v_code        text;
  v_condition   int := case when p_outcome = 'normal' then p_condition else null end;
  v_checkin     public.checkins;
begin
  -- exempt this transaction's device updates from the stock-floor trigger:
  -- the quantity math below moves with the loan rows and is self-consistent
  perform set_config('app.check_in', '1', true);

  -- lock the checkout + read its device
  select device_id, quantity into v_device_id, v_lent
  from public.checkouts where id = p_checkout_id for update;
  if v_device_id is null then
    raise exception 'checkout % not found', p_checkout_id using errcode = 'P0001';
  end if;

  -- lock the device too: quantity/condition math below must not race
  select quantity, type into v_device_qty, v_device_type
  from public.devices where id = v_device_id for update;

  if coalesce(p_quantity, 0) < 1 then
    raise exception 'check-in must move at least one unit' using errcode = 'P0001';
  end if;

  select coalesce(sum(quantity), 0) into v_taken
  from public.checkins where checkout_id = p_checkout_id;
  v_outstanding := v_lent - v_taken;

  if p_quantity > v_outstanding then
    raise exception 'check-in of % exceeds outstanding %',
      p_quantity, v_outstanding using errcode = 'P0001';
  end if;

  -- split gating: normal outcome, accessories only, never the full stock
  -- (a full split would just rename the record and zero the parent)
  if p_split then
    if p_outcome <> 'normal' then
      raise exception 'split requires a normal outcome' using errcode = 'P0001';
    end if;
    if v_device_type <> 'accessory' then
      raise exception 'only accessories can be split on check-in'
        using errcode = 'P0001';
    end if;
    if p_quantity >= v_device_qty then
      raise exception 'cannot split the entire stock (% of %)',
        p_quantity, v_device_qty using errcode = 'P0001';
    end if;
  end if;

  if p_outcome in ('consumed', 'other', 'lost') then
    -- units leave inventory; a lost check-in that drains the device also
    -- marks the record itself lost (single device: 1 → 0 + 'lost')
    update public.devices
       set quantity = quantity - p_quantity,
           status   = case
             when p_outcome = 'lost' and quantity - p_quantity = 0
               then 'lost'::public.device_status
             else status
           end
     where id = v_device_id;

  elsif p_split then
    -- next DEV-### fallback if no code supplied
    v_code := coalesce(nullif(p_split_code, ''),
      'DEV-' || lpad((
        coalesce(max((regexp_match(code, '^DEV-(\d+)$'))[1]::int), 0) + 1
      )::text, 3, '0'))
      from public.devices where code ~ '^DEV-\d+$';

    insert into public.devices (
      code, name, group_id, unit, manufacturer_id, model, serial_number,
      specifications, notes, condition, location, quantity, type, source,
      status, import_date, last_check_date, inventory_cycle_months,
      warranty_start, warranty_end, split_from_device_id
    )
    select
      v_code, name, group_id, unit, manufacturer_id, model, serial_number,
      specifications, notes, coalesce(v_condition, condition), location,
      -- child starts in storage: its units just came back and it has no
      -- loans of its own (parent may be 'checked_out' for its remainder)
      p_quantity, type, source, 'storage'::public.device_status,
      import_date, last_check_date,
      inventory_cycle_months, warranty_start, warranty_end, id
    from public.devices where id = v_device_id
    returning id into v_new_device;

    update public.devices set quantity = quantity - p_quantity where id = v_device_id;

  elsif v_condition is not null then
    -- normal merge: overwrite the whole record's condition
    update public.devices set condition = v_condition where id = v_device_id;
  end if;

  -- single insert (no follow-up update) so the checkins UPDATE trigger path
  -- (private.log_activity, which assumes a deleted_at column checkins does
  -- not have) is never exercised; split_to_device_id is known up front.
  insert into public.checkins (
    checkout_id, outcome, quantity, condition, photos, notes, split_to_device_id
  )
  values (
    p_checkout_id, p_outcome, p_quantity, v_condition, p_photos, p_notes, v_new_device
  )
  returning * into v_checkin;

  -- clear the stock-floor exemption: is_local only reverts at transaction
  -- end, and later statements in the same transaction must not inherit it
  perform set_config('app.check_in', '', true);

  return v_checkin;
end;
$function$
;

CREATE TRIGGER checkins_sync_device_status AFTER INSERT OR DELETE OR UPDATE ON public.checkins FOR EACH ROW EXECUTE FUNCTION private.sync_device_checkout_status();

CREATE TRIGGER checkouts_sync_device_status AFTER INSERT OR DELETE OR UPDATE ON public.checkouts FOR EACH ROW EXECUTE FUNCTION private.sync_device_checkout_status();

CREATE TRIGGER devices_enforce_stock_floor BEFORE UPDATE ON public.devices FOR EACH ROW EXECUTE FUNCTION private.enforce_device_stock_floor();


