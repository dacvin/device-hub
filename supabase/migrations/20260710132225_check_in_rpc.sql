set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_in(p_checkout_id uuid, p_outcome public.checkin_outcome, p_quantity integer, p_condition integer DEFAULT NULL::integer, p_photos jsonb DEFAULT '[]'::jsonb, p_notes text DEFAULT NULL::text, p_split boolean DEFAULT false, p_split_code text DEFAULT NULL::text)
 RETURNS public.checkins
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_device_id   uuid;
  v_lent        int;
  v_taken       int;
  v_outstanding int;
  v_new_device  uuid;
  v_code        text;
  v_condition   int := case when p_outcome = 'normal' then p_condition else null end;
  v_checkin     public.checkins;
begin
  -- lock the checkout + read its device
  select device_id, quantity into v_device_id, v_lent
  from public.checkouts where id = p_checkout_id for update;
  if v_device_id is null then
    raise exception 'checkout % not found', p_checkout_id using errcode = 'P0001';
  end if;

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

  if p_outcome in ('consumed', 'other') then
    -- units leave inventory (used up / lost); reason recorded by outcome
    update public.devices set quantity = quantity - p_quantity where id = v_device_id;

  elsif p_split then
    -- next DEV-### fallback if no code supplied
    v_code := coalesce(nullif(p_split_code, ''),
      'DEV-' || lpad((
        coalesce(max((regexp_match(code, '^DEV-(\d+)$'))[1]::int), 0) + 1
      )::text, 3, '0'))
      from public.devices where code ~ '^DEV-\d+$';

    insert into public.devices (
      code, name, group_id, unit, manufacturer_id, model, serial_number,
      specifications, notes, condition, location, quantity, source, status,
      import_date, last_check_date, inventory_cycle_months, warranty_start,
      warranty_end, split_from_device_id
    )
    select
      v_code, name, group_id, unit, manufacturer_id, model, serial_number,
      specifications, notes, coalesce(v_condition, condition), location,
      p_quantity, source, status, import_date, last_check_date,
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

  return v_checkin;
end;
$function$
;

GRANT EXECUTE ON FUNCTION public.check_in(uuid,public.checkin_outcome,int,int,jsonb,text,boolean,text) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.check_in(uuid,public.checkin_outcome,int,int,jsonb,text,boolean,text) FROM anon, public;


