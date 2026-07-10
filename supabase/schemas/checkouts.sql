-- ============================================================
-- checkouts / checkins — device lending.
-- A checkout is one lending event; a device's `quantity` is the total
-- units owned and is NEVER mutated on checkout — availability is derived
-- (quantity − Σ outstanding). A checkin is one return event; a checkout
-- can have many (installment returns). Each check-in has ONE outcome +
-- a quantity: normal (back to inventory; may split), consumed (tiêu hao —
-- used up), or other (lost/damaged). photos are JSONB file-descriptor
-- arrays, same shape as devices.photos.
-- ============================================================

-- Disposition of the units in a check-in event. English slugs; UI localizes.
create type public.checkin_outcome as enum ('normal', 'consumed', 'other');

create table public.checkouts (
  id                   uuid primary key default gen_random_uuid(),
  device_id            uuid not null references public.devices(id) on delete restrict,
  borrower_name        text not null,
  quantity             int  not null check (quantity >= 1),
  checked_out_by       uuid references public.users(id) on delete set null
                         default public.app_user_id(),
  checked_out_at       timestamptz not null default now(),
  expected_return_date date,
  photos               jsonb not null default '[]'::jsonb
                         check (jsonb_typeof(photos) = 'array'),
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table public.checkins (
  id                 uuid primary key default gen_random_uuid(),
  checkout_id        uuid not null references public.checkouts(id) on delete restrict,
  outcome            public.checkin_outcome not null,
  quantity           int  not null check (quantity >= 1),
  condition          int  check (condition between 0 and 100),
  photos             jsonb not null default '[]'::jsonb
                       check (jsonb_typeof(photos) = 'array'),
  notes              text,
  split_to_device_id uuid references public.devices(id) on delete set null,
  checked_in_by      uuid references public.users(id) on delete set null
                       default public.app_user_id(),
  checked_in_at      timestamptz not null default now(),
  created_at         timestamptz not null default now(),
  -- condition + split only make sense for 'normal'
  check (outcome = 'normal' or (condition is null and split_to_device_id is null))
);

create index checkouts_device_idx   on public.checkouts(device_id);
create index checkouts_active_idx   on public.checkouts(device_id, expected_return_date);
create index checkins_checkout_idx  on public.checkins(checkout_id);
create index devices_split_from_idx on public.devices(split_from_device_id);

alter table public.checkouts enable row level security;
alter table public.checkins  enable row level security;

create trigger checkouts_set_updated_at
  before update on public.checkouts
  for each row execute function public.set_updated_at();

-- Activity log: borrower_name / checkout id label the checkout; checkins are
-- labelled by their id (no natural text label).
create trigger checkouts_log_activity
  after insert or update or delete on public.checkouts
  for each row execute function private.log_activity('borrower_name');

create trigger checkins_log_activity
  after insert or update or delete on public.checkins
  for each row execute function private.log_activity('id');

-- Access model mirrors devices: any authenticated user has full CRUD.
create policy checkouts_read   on public.checkouts for select to authenticated using (true);
create policy checkouts_insert on public.checkouts for insert to authenticated with check (true);
create policy checkouts_update on public.checkouts for update to authenticated using (true) with check (true);
create policy checkouts_delete on public.checkouts for delete to authenticated using (true);

create policy checkins_read   on public.checkins for select to authenticated using (true);
create policy checkins_insert on public.checkins for insert to authenticated with check (true);
create policy checkins_update on public.checkins for update to authenticated using (true) with check (true);
create policy checkins_delete on public.checkins for delete to authenticated using (true);

-- No anon access (authenticated-only policies); strip the default anon grant.
revoke all on public.checkouts from anon;
revoke all on public.checkins  from anon;

-- ============================================================
-- Availability guard — reject a checkout that would push a device's
-- outstanding loans above its owned quantity. Only checkouts can violate
-- the invariant (checkins and the check_in RPC only reduce outstanding),
-- so the guard lives here. SECURITY INVOKER: authenticated can already
-- read every checkouts/checkins/devices row (using(true)).
-- ============================================================
create or replace function private.enforce_checkout_availability()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_total   int;
  v_on_loan int;
begin
  select quantity into v_total from public.devices where id = new.device_id;

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
$$;

create trigger checkouts_enforce_availability
  before insert or update on public.checkouts
  for each row execute function private.enforce_checkout_availability();

-- ============================================================
-- check_in — atomic return of units against a checkout. One transaction:
-- insert the checkin, then by outcome: consumed/other drop the units from
-- inventory; normal either overwrites device condition (merge) or spins the
-- units into a new device record (split). SECURITY INVOKER: the caller
-- (authenticated) already has insert/update on checkins + devices via RLS.
-- ============================================================
create or replace function public.check_in(
  p_checkout_id uuid,
  p_outcome     public.checkin_outcome,
  p_quantity    int,
  p_condition   int     default null,
  p_photos      jsonb   default '[]'::jsonb,
  p_notes       text    default null,
  p_split       boolean default false,
  p_split_code  text    default null
)
returns public.checkins
language plpgsql
set search_path = ''
as $$
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
$$;

-- Callable by authenticated via PostgREST RPC.
grant execute on function
  public.check_in(uuid,public.checkin_outcome,int,int,jsonb,text,boolean,text)
  to authenticated, service_role;
revoke execute on function
  public.check_in(uuid,public.checkin_outcome,int,int,jsonb,text,boolean,text)
  from anon, public;

-- ============================================================
-- device_loan_status — per-device derived availability. security_invoker
-- so the caller's RLS on the underlying tables applies. on_loan is the sum
-- of outstanding units across the device's checkouts.
-- ============================================================
create view public.device_loan_status
with (security_invoker = on) as
select
  d.id as device_id,
  d.quantity as total,
  coalesce(sum(c.quantity - coalesce(ci.taken, 0)), 0)::int as on_loan,
  (d.quantity - coalesce(sum(c.quantity - coalesce(ci.taken, 0)), 0))::int as available,
  coalesce(bool_or(
    c.expected_return_date < current_date
    and (c.quantity - coalesce(ci.taken, 0)) > 0
  ), false) as has_overdue,
  count(c.id) filter (where (c.quantity - coalesce(ci.taken, 0)) > 0)::int as active_checkouts
from public.devices d
left join public.checkouts c on c.device_id = d.id
left join (
  select checkout_id, sum(quantity) as taken
  from public.checkins group by checkout_id
) ci on ci.checkout_id = c.id
group by d.id, d.quantity;

revoke all on public.device_loan_status from anon;
grant select on public.device_loan_status to authenticated, service_role;
