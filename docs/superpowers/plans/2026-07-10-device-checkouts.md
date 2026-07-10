# Device Check-outs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let operators lend device units to free-text borrowers, see what's checked out to whom, attach proof photos, and check units back in with a return condition — including partial/installment returns, missing units, and condition-driven record splitting.

**Architecture:** A `checkouts` table (one lending event) and a `checkins` table (many return events per checkout). Device availability is *derived* (`device.quantity − Σ outstanding`), never mutated on checkout. Checkout is a guarded insert; check-in is a single Postgres `check_in` RPC that atomically writes the checkin row, decrements inventory for missing units, and either overwrites device condition (merge) or spins off a new device record (split). The frontend mirrors the existing `features/devices` layer (typed Supabase client, generated `database.types`, hand-written zod, camel/snake via `camelcase-keys`, root-query-key + invalidation).

**Tech Stack:** Postgres (Supabase) + pgTAP; Next.js App Router; TanStack Query + TanStack Form; zod v4; shadcn/ui + Tailwind v4; next-intl (EN/VI). Frontend has no unit tests by convention — verified live via Playwright MCP.

## Global Constraints

- **Schema workflow:** edit files in `supabase/schemas/*.sql`; generate migrations with `supabase db diff -f <name>`. NEVER hand-author migration files.
- **DB tests:** pgTAP in `supabase/tests/NN_*.sql`, run with `supabase test db`.
- **RLS parity with devices:** authenticated gets full CRUD; `revoke all … from anon`; grant to `authenticated` + `service_role`.
- **camel/snake boundary:** DB is snake_case; client types are camelCase via `camelcase-keys` / `snakecase-keys`. Never leak snake_case into React.
- **Query keys:** one root `getXxxQueryOptions()` owns the bare key; other queries build on `().queryKey`; mutations invalidate it. No exported key constants.
- **i18n:** every UI string comes from `messages/en.json` + `messages/vi.json`. No hardcoded copy.
- **Conditional classes:** `cn()` with `cond && 'x'` / `{ 'x': cond }` — never ternary/concat.
- **shadcn primitives:** add via `pnpm dlx shadcn@latest add <name>`; never hand-edit `src/components/ui/*`.
- **UI design:** before building the new UI surfaces (Checkouts page, dialogs, detail panel), invoke the **ui-ux-pro-max** (or `frontend-design`) skill to design them intentionally, then implement.
- **FE gate (run from `client/`):** `pnpm lint:fix` → `pnpm build` → `pnpm run format:fix`. On failure, fix and re-run from the start.
- **Codes:** device codes are `DEV-###` (zero-padded, sequential, best-effort, always user-editable).

---

## Phase A — Database & backend

### Task A1: `checkouts` + `checkins` tables, `devices.split_from_device_id` column

**Files:**
- Create: `supabase/schemas/checkouts.sql`
- Modify: `supabase/schemas/devices.sql` (add one column inside the `create table` block)
- Create (migration, generated): `supabase/migrations/<ts>_checkouts.sql`
- Test: `supabase/tests/09_checkouts_schema_test.sql`

**Interfaces:**
- Produces tables `public.checkouts`, `public.checkins`; column `public.devices.split_from_device_id`.
- `checkouts`: `id, device_id, borrower_name, quantity, checked_out_by, checked_out_at, expected_return_date, photos, notes, created_at, updated_at`.
- `checkins`: `id, checkout_id, returned_quantity, missing_quantity, condition, photos, notes, split_to_device_id, checked_in_by, checked_in_at, created_at`.

- [ ] **Step 1: Add the provenance column to `devices.sql`**

In `supabase/schemas/devices.sql`, inside the `create table public.devices (...)` block, after the `documents` line, add:

```sql
  -- provenance: set when this record was split off from another device on check-in
  split_from_device_id uuid references public.devices(id) on delete set null,
```

- [ ] **Step 2: Write `supabase/schemas/checkouts.sql`**

```sql
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
```

- [ ] **Step 3: Generate the migration**

Run (from repo root): `supabase db diff -f checkouts`
Expected: a new file `supabase/migrations/<timestamp>_checkouts.sql` containing the `create type public.checkin_outcome`, the two `create table`, the `alter table public.devices add column split_from_device_id`, indexes, RLS enable, triggers, policies, and the `revoke`. Open it and confirm no unrelated diff leaked in.

- [ ] **Step 4: Apply locally**

Run: `supabase db reset`
Expected: migrations apply cleanly, seed runs, no errors.

- [ ] **Step 5: Write the schema-shape pgTAP test**

Create `supabase/tests/09_checkouts_schema_test.sql` (follow the style of `supabase/tests/01_schema_shape_test.sql`). Assert:

```sql
begin;
select plan(14);

select has_table('public', 'checkouts', 'checkouts table exists');
select has_table('public', 'checkins',  'checkins table exists');
select has_column('public', 'devices', 'split_from_device_id', 'devices has split_from_device_id');
select has_column('public', 'checkins', 'outcome', 'checkins has outcome');

select col_is_pk('public', 'checkouts', 'id', 'checkouts pk');
select col_not_null('public', 'checkouts', 'device_id', 'checkouts.device_id not null');
select col_not_null('public', 'checkouts', 'borrower_name', 'borrower_name not null');
select col_has_default('public', 'checkouts', 'checked_out_by', 'checked_out_by defaults');

select col_is_pk('public', 'checkins', 'id', 'checkins pk');
select col_not_null('public', 'checkins', 'outcome', 'checkins.outcome not null');

-- RLS enabled
select is(relrowsecurity, true, 'checkouts RLS on')
  from pg_class where oid = 'public.checkouts'::regclass;
select is(relrowsecurity, true, 'checkins RLS on')
  from pg_class where oid = 'public.checkins'::regclass;

-- quantity >= 1 constraints reject bad rows
select throws_ok(
  $$ insert into public.checkouts (device_id, borrower_name, quantity)
     values ((select id from public.devices limit 1), 'X', 0) $$,
  '23514', null, 'checkout quantity must be >= 1');

select throws_ok(
  $$ insert into public.checkins (checkout_id, outcome, quantity)
     values ((select id from public.checkouts limit 1), 'normal', 0) $$,
  '23514', null, 'checkin quantity must be >= 1');

select * from finish();
rollback;
```

- [ ] **Step 6: Run the test**

Run: `supabase test db`
Expected: `09_checkouts_schema_test.sql` passes (all assertions ok).

- [ ] **Step 7: Commit**

```bash
git add supabase/schemas/checkouts.sql supabase/schemas/devices.sql supabase/migrations supabase/tests/09_checkouts_schema_test.sql
git commit -m "feat(db/checkouts): checkouts + checkins tables, devices provenance column"
```

---

### Task A2: Availability-guard trigger (reject over-checkout)

**Files:**
- Modify: `supabase/schemas/checkouts.sql` (append the function + trigger)
- Modify: `supabase/migrations/<new ts>_checkout_guard.sql` (generated)
- Test: `supabase/tests/10_checkout_guard_test.sql`

**Interfaces:**
- Produces `private.enforce_checkout_availability()` trigger fn + `checkouts_enforce_availability` BEFORE INSERT/UPDATE trigger.
- Rejects any insert/update where `new.quantity + Σ(outstanding of other active checkouts) > device.quantity`.

- [ ] **Step 1: Write the failing test first**

Create `supabase/tests/10_checkout_guard_test.sql`:

```sql
begin;
select plan(3);

-- seed a device with quantity 5
insert into public.devices (id, code, name, group_id, manufacturer_id, quantity, condition)
values ('11111111-1111-1111-1111-111111111111', 'DEV-900', 'Guard Test',
        (select id from public.groups limit 1),
        (select id from public.manufacturers limit 1), 5, 100);

-- checkout of 3 is fine
select lives_ok(
  $$ insert into public.checkouts (device_id, borrower_name, quantity)
     values ('11111111-1111-1111-1111-111111111111', 'Alice', 3) $$,
  'checkout within available succeeds');

-- another checkout of 3 (total 6 > 5) must fail
select throws_ok(
  $$ insert into public.checkouts (device_id, borrower_name, quantity)
     values ('11111111-1111-1111-1111-111111111111', 'Bob', 3) $$,
  'P0001', null, 'over-checkout rejected');

-- a checkout of exactly the remaining 2 succeeds
select lives_ok(
  $$ insert into public.checkouts (device_id, borrower_name, quantity)
     values ('11111111-1111-1111-1111-111111111111', 'Carol', 2) $$,
  'checkout of remaining units succeeds');

select * from finish();
rollback;
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `supabase test db`
Expected: `10_checkout_guard_test.sql` FAILS — the "over-checkout rejected" assertion fails because no guard exists yet (the second insert currently succeeds).

- [ ] **Step 3: Append the guard to `checkouts.sql`**

Add to `supabase/schemas/checkouts.sql`:

```sql
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
```

- [ ] **Step 4: Generate + apply the migration**

Run: `supabase db diff -f checkout_guard` then `supabase db reset`
Expected: migration contains only the new function + trigger; reset is clean.

- [ ] **Step 5: Run the test to confirm it passes**

Run: `supabase test db`
Expected: `10_checkout_guard_test.sql` PASSES (all 3 assertions).

- [ ] **Step 6: Commit**

```bash
git add supabase/schemas/checkouts.sql supabase/migrations supabase/tests/10_checkout_guard_test.sql
git commit -m "feat(db/checkouts): availability guard trigger rejects over-checkout"
```

---

### Task A3: `check_in` RPC (normal-merge / normal-split / consumed / other)

**Files:**
- Modify: `supabase/schemas/checkouts.sql` (append the RPC)
- Modify: `supabase/migrations/<new ts>_check_in_rpc.sql` (generated)
- Test: `supabase/tests/11_check_in_rpc_test.sql`

**Interfaces:**
- Produces `public.check_in(p_checkout_id uuid, p_outcome public.checkin_outcome, p_quantity int, p_condition int default null, p_photos jsonb default '[]', p_notes text default null, p_split boolean default false, p_split_code text default null) returns public.checkins`.
- Behaviour: inserts one `checkins` row (`outcome`, `quantity`). Then, by outcome:
  - `consumed` / `other` → `device.quantity -= p_quantity` (units leave inventory).
  - `normal` + `p_split` → `device.quantity -= p_quantity` and insert a new device (`quantity=p_quantity`, `condition=p_condition`, attrs copied, code = `p_split_code` or next `DEV-###`, `split_from_device_id`=source), stamping `checkins.split_to_device_id`.
  - `normal` + not split, `p_condition` not null → `device.condition = p_condition` (merge override).
- Validation: raises `P0001` if `p_quantity < 1` or `> checkout.outstanding`; for non-`normal` outcomes, `p_condition`/`p_split` are ignored (and the table CHECK forbids storing them).

**RESOLVED:** `public.devices.code` is **not unique** — the unique constraint was dropped by migration `20260709082436_units_enum_and_nonunique_code.sql`. So the split path's generated/supplied code carries no collision risk; the fallback `DEV-###` generator is a convenience only, and a caller-supplied `p_split_code` needs no duplicate-code handling.

- [ ] **Step 1: Write the failing tests first**

Create `supabase/tests/11_check_in_rpc_test.sql` covering each outcome, split, and over-return. Named args make the outcome-based calls readable:

```sql
begin;
select plan(9);

-- device with 5 units @ condition 100
insert into public.devices (id, code, name, group_id, manufacturer_id, quantity, condition)
values ('22222222-2222-2222-2222-222222222222', 'DEV-910', 'RPC Test',
        (select id from public.groups limit 1),
        (select id from public.manufacturers limit 1), 5, 100);

-- checkout 4 units
insert into public.checkouts (id, device_id, borrower_name, quantity)
values ('33333333-3333-3333-3333-333333333333',
        '22222222-2222-2222-2222-222222222222', 'Dana', 4);

-- (a) normal merge return of 1 unit @ condition 80, no split
select lives_ok(
  $$ select public.check_in('33333333-3333-3333-3333-333333333333', 'normal', 1, 80) $$,
  'normal merge check-in succeeds');
select is( (select condition from public.devices where id='22222222-2222-2222-2222-222222222222'),
           80, 'merge overwrites device condition');
select is( (select quantity from public.devices where id='22222222-2222-2222-2222-222222222222'),
           5, 'merge does not change device quantity');

-- (b) consumed (tiêu hao) of 1 unit
select lives_ok(
  $$ select public.check_in('33333333-3333-3333-3333-333333333333', 'consumed', 1) $$,
  'consumed check-in succeeds');
select is( (select quantity from public.devices where id='22222222-2222-2222-2222-222222222222'),
           4, 'consumed decrements device quantity');

-- (c) normal split return of 2 units @ condition 60
select lives_ok(
  $$ select public.check_in('33333333-3333-3333-3333-333333333333',
        'normal', 2, 60, '[]'::jsonb, null, true) $$,
  'split check-in succeeds');
select is( (select quantity from public.devices where id='22222222-2222-2222-2222-222222222222'),
           2, 'split decrements source quantity');
select ok(
  exists(select 1 from public.devices
         where split_from_device_id='22222222-2222-2222-2222-222222222222'
           and quantity=2 and condition=60),
  'split created a child device with returned units + condition');

-- (d) over-return rejected: outstanding is now 0 (1 normal + 1 consumed + 2 split = 4)
select throws_ok(
  $$ select public.check_in('33333333-3333-3333-3333-333333333333', 'other', 1) $$,
  'P0001', null, 'check-in beyond outstanding is rejected');

select * from finish();
rollback;
```

- [ ] **Step 2: Run to confirm failure**

Run: `supabase test db`
Expected: `11_check_in_rpc_test.sql` FAILS — `check_in` does not exist yet.

- [ ] **Step 3: Append the RPC to `checkouts.sql`**

```sql
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

  insert into public.checkins (checkout_id, outcome, quantity, condition, photos, notes)
  values (p_checkout_id, p_outcome, p_quantity, v_condition, p_photos, p_notes)
  returning * into v_checkin;

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

    update public.checkins set split_to_device_id = v_new_device
    where id = v_checkin.id
    returning * into v_checkin;

  elsif v_condition is not null then
    -- normal merge: overwrite the whole record's condition
    update public.devices set condition = v_condition where id = v_device_id;
  end if;

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
```

- [ ] **Step 4: Generate + apply the migration**

Run: `supabase db diff -f check_in_rpc` then `supabase db reset`
Expected: migration contains only the function + grants; reset is clean.

- [ ] **Step 5: Run the tests to confirm they pass**

Run: `supabase test db`
Expected: `11_check_in_rpc_test.sql` PASSES (all 9 assertions).

- [ ] **Step 6: Commit**

```bash
git add supabase/schemas/checkouts.sql supabase/migrations supabase/tests/11_check_in_rpc_test.sql
git commit -m "feat(db/checkouts): check_in RPC (merge/split/missing/installments)"
```

---

### Task A4: `device_loan_status` view (derived availability)

**Files:**
- Modify: `supabase/schemas/checkouts.sql` (append the view)
- Modify: `supabase/migrations/<new ts>_device_loan_status.sql` (generated)
- Test: extend `supabase/tests/09_checkouts_schema_test.sql` (or a new `12_loan_status_view_test.sql`)

**Interfaces:**
- Produces view `public.device_loan_status(device_id, total, on_loan, available, has_overdue, active_checkouts)` — one row per device. Read by the FE for the list badge and the detail availability line.

- [ ] **Step 1: Append the view to `checkouts.sql`**

```sql
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
```

- [ ] **Step 2: Generate + apply**

Run: `supabase db diff -f device_loan_status` then `supabase db reset`
Expected: migration adds the view + grants; reset clean.

- [ ] **Step 3: Write the view test**

Create `supabase/tests/12_loan_status_view_test.sql`:

```sql
begin;
select plan(3);

insert into public.devices (id, code, name, group_id, manufacturer_id, quantity, condition)
values ('44444444-4444-4444-4444-444444444444', 'DEV-920', 'View Test',
        (select id from public.groups limit 1),
        (select id from public.manufacturers limit 1), 10, 100);

insert into public.checkouts (device_id, borrower_name, quantity, expected_return_date)
values ('44444444-4444-4444-4444-444444444444', 'Eve', 3, current_date - 1);

select is( (select available from public.device_loan_status
            where device_id='44444444-4444-4444-4444-444444444444'),
           7, 'available = total - on_loan');
select is( (select on_loan from public.device_loan_status
            where device_id='44444444-4444-4444-4444-444444444444'),
           3, 'on_loan sums outstanding');
select is( (select has_overdue from public.device_loan_status
            where device_id='44444444-4444-4444-4444-444444444444'),
           true, 'past-due active checkout flags overdue');

select * from finish();
rollback;
```

- [ ] **Step 4: Run the test**

Run: `supabase test db`
Expected: `12_loan_status_view_test.sql` passes.

- [ ] **Step 5: Commit**

```bash
git add supabase/schemas/checkouts.sql supabase/migrations supabase/tests/12_loan_status_view_test.sql
git commit -m "feat(db/checkouts): device_loan_status view (derived availability)"
```

---

### Task A5: Storage bucket, policies, config, media proxy

**Files:**
- Modify: `supabase/schemas/_core.sql` (add bucket + extend storage policies)
- Modify: `supabase/config.toml` (declare `checkout-photos` bucket)
- Modify: `client/src/app/api/device-media/[bucket]/[...path]/route.ts` (whitelist + inline-image list)
- Modify: `supabase/migrations/<new ts>_checkout_storage.sql` (generated)
- Test: extend `supabase/tests/08_storage_policies_test.sql`

**Interfaces:**
- Produces a private storage bucket `checkout-photos` holding BOTH checkout and check-in photos (one bucket; paths namespaced by id).
- The `/api/device-media/checkout-photos/<path>` proxy serves it inline for images.

- [ ] **Step 1: Add the bucket + extend policies in `_core.sql`**

Change the buckets insert to include the new bucket, and add `'checkout-photos'` to each of the four `bucket_id in (...)` storage policies:

```sql
insert into storage.buckets (id, name, public) values
  ('device-photos',    'device-photos',    false),
  ('device-documents', 'device-documents', false),
  ('checkout-photos',  'checkout-photos',  false)
on conflict (id) do nothing;
```

Then update each policy's list to `bucket_id in ('device-photos', 'device-documents', 'checkout-photos')` (all four: read/write/update/delete).

- [ ] **Step 2: Declare the bucket in `config.toml`**

After the `[storage.buckets.device-documents]` block add:

```toml
[storage.buckets.checkout-photos]
public = false
file_size_limit = "5MiB"
allowed_mime_types = ["image/png", "image/jpeg", "image/webp"]
```

- [ ] **Step 3: Whitelist the bucket in the media proxy**

In `client/src/app/api/device-media/[bucket]/[...path]/route.ts`:
- add `'checkout-photos'` to `ALLOWED_BUCKETS`
- change the inline-image guard so checkout photos also render inline:

```ts
const ALLOWED_BUCKETS = new Set(['device-photos', 'device-documents', 'checkout-photos']);
const INLINE_IMAGE_BUCKETS = new Set(['device-photos', 'checkout-photos']);
// ...
const inlineImage = INLINE_IMAGE_BUCKETS.has(bucket) && INLINE_IMAGE_TYPES.has(data.type);
```

- [ ] **Step 4: Generate + apply the migration**

Run: `supabase db diff -f checkout_storage` then `supabase db reset`
Expected: migration adds the bucket row + updates the four storage policies.

- [ ] **Step 5: Extend the storage pgTAP test**

In `supabase/tests/08_storage_policies_test.sql`, bump the plan count and add assertions that an authenticated role may select/insert into `checkout-photos` and anon may not (mirror the existing device-photos assertions).

- [ ] **Step 6: Run the test**

Run: `supabase test db`
Expected: `08_storage_policies_test.sql` passes with the new checkout-photos assertions.

- [ ] **Step 7: Commit**

```bash
git add supabase/schemas/_core.sql supabase/config.toml supabase/migrations supabase/tests/08_storage_policies_test.sql "client/src/app/api/device-media/[bucket]/[...path]/route.ts"
git commit -m "feat(checkouts): checkout-photos storage bucket + proxy whitelist"
```

---

### Task A6: Regenerate database types

**Files:**
- Modify: `client/src/types/database.types.ts` (generated)

- [ ] **Step 1: Regenerate**

Run the project's type-gen script (check `client/package.json` for the exact script name, e.g. `pnpm gen:types`; otherwise `supabase gen types typescript --local > client/src/types/database.types.ts`).
Expected: `Tables<'checkouts'>`, `Tables<'checkins'>`, `devices.split_from_device_id`, and the `check_in` RPC (`Database['public']['Functions']['check_in']`) now appear.

- [ ] **Step 2: Type-check**

Run (from `client/`): `pnpm build`
Expected: compiles (no consumers yet).

- [ ] **Step 3: Commit**

```bash
git add client/src/types/database.types.ts
git commit -m "chore(types): regenerate database types for checkouts"
```

---
## Phase B — Client API layer

All new files live under `client/src/features/checkouts/`. Run commands from `client/`.

### Task B1: Types, constants, validations

**Files:**
- Create: `client/src/features/checkouts/types/checkout.ts`
- Create: `client/src/features/checkouts/constants/checkout.ts`
- Create: `client/src/features/checkouts/validations/checkout.ts`

**Interfaces:**
- Produces types `Checkout`, `Checkin`, `CheckinOutcome`, `CheckoutStatus`, `CheckoutWithDetail`, `CheckoutListItem`.
- Produces `CHECKIN_OUTCOMES`, `CHECKIN_OUTCOME_LABEL_KEY`, `CHECKOUT_STATUS_LABEL_KEY`, `CHECKOUT_PHOTOS_BUCKET`, `checkoutStatus()`, `todayIso()`.
- Produces `checkoutFormSchema` / `CheckoutFormValues` / `CHECKOUT_FORM_DEFAULTS`, `checkInFormSchema` / `CheckInFormValues` / `CHECK_IN_FORM_DEFAULTS`.

- [ ] **Step 1: Write `types/checkout.ts`**

```ts
import type { CamelCaseKeys } from 'camelcase-keys';

import type { Enums, Tables, TablesInsert } from '@/types/database.types';
// Photos are the same generic file-descriptor shape as device media.
import type { DeviceFileDescriptor } from '@/features/devices/types/device';

export type Checkout = CamelCaseKeys<Tables<'checkouts'>>;
export type CheckoutInsert = CamelCaseKeys<TablesInsert<'checkouts'>>;
export type Checkin = CamelCaseKeys<Tables<'checkins'>>;
export type CheckinOutcome = Enums<'checkin_outcome'>;

export type { DeviceFileDescriptor as CheckoutFileDescriptor };

// Derived, never stored.
export type CheckoutStatus = 'outstanding' | 'overdue' | 'closed';

// A checkout + its device + checkins + derived fields, for the device panel.
export type CheckoutWithDetail = Checkout & {
  deviceCode: string;
  deviceName: string;
  checkedOutByName: string | null;
  checkins: Checkin[];
  outstanding: number;
  status: CheckoutStatus;
};

// Row for the /checkouts list table.
export type CheckoutListItem = {
  id: string;
  deviceId: string;
  deviceCode: string;
  deviceName: string;
  borrowerName: string;
  quantity: number;
  outstanding: number;
  checkedOutByName: string | null;
  checkedOutAt: string;
  expectedReturnDate: string | null;
  status: CheckoutStatus;
};

// One row of public.device_loan_status.
export type DeviceLoanStatus = {
  deviceId: string;
  total: number;
  onLoan: number;
  available: number;
  hasOverdue: boolean;
  activeCheckouts: number;
};
```

- [ ] **Step 2: Write `constants/checkout.ts`**

```ts
import { Constants } from '@/types/database.types';

import type { CheckinOutcome, CheckoutStatus } from '../types/checkout';

export const CHECKOUT_PHOTOS_BUCKET = 'checkout-photos';

export const CHECKIN_OUTCOMES = Constants.public.Enums.checkin_outcome; // ['normal','consumed','other']

export const CHECKIN_OUTCOME_LABEL_KEY: Record<CheckinOutcome, string> = {
  normal: 'checkouts.outcomeNormal',
  consumed: 'checkouts.outcomeConsumed',
  other: 'checkouts.outcomeOther',
};

export const CHECKOUT_STATUS_LABEL_KEY: Record<CheckoutStatus, string> = {
  outstanding: 'checkouts.statusOutstanding',
  overdue: 'checkouts.statusOverdue',
  closed: 'checkouts.statusClosed',
};

export const CHECKOUT_SORTABLE_COLUMNS = [
  'checked_out_at',
  'borrower_name',
  'expected_return_date',
] as const;

// Local date (YYYY-MM-DD) for overdue comparison — matches DB `current_date`.
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// Pure: derive status from outstanding + expected return date.
export function checkoutStatus(
  outstanding: number,
  expectedReturnDate: string | null,
): CheckoutStatus {
  if (outstanding <= 0) return 'closed';
  if (expectedReturnDate && expectedReturnDate < todayIso()) return 'overdue';
  return 'outstanding';
}
```

- [ ] **Step 3: Write `validations/checkout.ts`**

```ts
import { z } from 'zod';

import { CHECKIN_OUTCOMES } from '../constants/checkout';

const nullableText = z.string().trim().catch('');
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'validation.dateInvalid' })
  .or(z.literal(''))
  .catch('');
// condition lives as '' (unset) or a 0–100 int in the form.
const optionalCondition = z
  .union([z.literal(''), z.coerce.number().int().min(0).max(100)])
  .catch('');

export const checkoutFormSchema = z.object({
  borrowerName: z.string().trim().min(1, { message: 'validation.borrowerRequired' }),
  quantity: z.coerce.number().int().min(1, { message: 'validation.quantityMin' }),
  expectedReturnDate: dateString,
  notes: nullableText,
});
export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
export const CHECKOUT_FORM_DEFAULTS: CheckoutFormValues = {
  borrowerName: '',
  quantity: 1,
  expectedReturnDate: '',
  notes: '',
};

export const checkInFormSchema = z
  .object({
    outcome: z.enum(CHECKIN_OUTCOMES),
    quantity: z.coerce.number().int().min(1, { message: 'validation.quantityMin' }),
    condition: optionalCondition,
    notes: nullableText,
    split: z.boolean().catch(false),
    splitCode: nullableText,
  })
  // condition + split only apply to 'normal'
  .refine((v) => v.outcome === 'normal' || (v.condition === '' && !v.split), {
    message: 'validation.checkinOutcomeShape',
    path: ['outcome'],
  });
export type CheckInFormValues = z.infer<typeof checkInFormSchema>;
export const CHECK_IN_FORM_DEFAULTS: CheckInFormValues = {
  outcome: 'normal',
  quantity: 1,
  condition: '',
  notes: '',
  split: false,
  splitCode: '',
};
```

- [ ] **Step 4: Type-check + commit**

Run (from `client/`): `pnpm build`
Expected: compiles.

```bash
git add client/src/features/checkouts/types client/src/features/checkouts/constants client/src/features/checkouts/validations
git commit -m "feat(fe/checkouts): types, constants, validations"
```

---

### Task B2: Read queries (list, device checkouts, loan status)

**Files:**
- Create: `client/src/features/checkouts/api/get-checkouts.ts`
- Create: `client/src/features/checkouts/api/get-device-loan-status.ts`

**Interfaces:**
- Consumes types from B1; `createClient` from `@/lib/supabase/client`; the query-config helpers from `@/lib/react-query`.
- Produces `getCheckoutsQueryOptions()` (root key `['checkouts']`), `getCheckoutsListQueryOptions()`, `useCheckoutsList()`, `getDeviceCheckoutsQueryOptions(deviceId)`, `useDeviceCheckouts(deviceId)`, `getDeviceLoanStatusQueryOptions(deviceId)`, `useDeviceLoanStatus(deviceId)`, `fetchLoanStatusFor(ids)` (bulk, for the list badge).

- [ ] **Step 1: Write `get-checkouts.ts`**

```ts
import { queryOptions, skipToken, useQuery } from '@tanstack/react-query';
import camelcaseKeys from 'camelcase-keys';

import { createClient } from '@/lib/supabase/client';
import type { QueryConfig } from '@/lib/react-query';

import { checkoutStatus } from '../constants/checkout';
import { fromDbDescriptors } from '@/features/devices/api/media-descriptor';

import type {
  Checkin,
  CheckoutListItem,
  CheckoutWithDetail,
} from '../types/checkout';

// Root query-options for the checkouts namespace: the shared prefix.
export const getCheckoutsQueryOptions = () =>
  queryOptions({ queryKey: ['checkouts'] as const });

const SELECT =
  '*, device:devices(code, name), checked_out_by_user:users!checkouts_checked_out_by_fkey(name), checkins(*)';

type Row = {
  id: string;
  device_id: string;
  borrower_name: string;
  quantity: number;
  checked_out_at: string;
  expected_return_date: string | null;
  device: { code: string; name: string } | null;
  checked_out_by_user: { name: string } | null;
  checkins: { quantity: number }[];
};

function outstandingOf(quantity: number, checkins: { quantity: number }[]): number {
  return quantity - checkins.reduce((sum, c) => sum + c.quantity, 0);
}

export const getCheckoutsList = async (): Promise<CheckoutListItem[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('checkouts')
    .select(SELECT)
    .order('checked_out_at', { ascending: false });
  if (error) throw error;

  return (data as unknown as Row[]).map((r) => {
    const outstanding = outstandingOf(r.quantity, r.checkins);
    return {
      id: r.id,
      deviceId: r.device_id,
      deviceCode: r.device?.code ?? '—',
      deviceName: r.device?.name ?? '—',
      borrowerName: r.borrower_name,
      quantity: r.quantity,
      outstanding,
      checkedOutByName: r.checked_out_by_user?.name ?? null,
      checkedOutAt: r.checked_out_at,
      expectedReturnDate: r.expected_return_date,
      status: checkoutStatus(outstanding, r.expected_return_date),
    };
  });
};

export const getCheckoutsListQueryOptions = () =>
  queryOptions({
    queryKey: [...getCheckoutsQueryOptions().queryKey, 'list'],
    queryFn: getCheckoutsList,
  });

export const useCheckoutsList = (queryConfig?: QueryConfig<typeof getCheckoutsListQueryOptions>) =>
  useQuery({ ...getCheckoutsListQueryOptions(), ...queryConfig });

// Full detail for one device's checkouts (active + closed), newest first.
export const getDeviceCheckouts = async (deviceId: string): Promise<CheckoutWithDetail[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('checkouts')
    .select(SELECT)
    .eq('device_id', deviceId)
    .order('checked_out_at', { ascending: false });
  if (error) throw error;

  return (data as unknown as (Row & { checkins: Record<string, unknown>[] })[]).map((r) => {
    const checkins = (r.checkins as unknown[]).map((c) => {
      const cam = camelcaseKeys(c as Record<string, unknown>) as unknown as Checkin;
      return { ...cam, photos: fromDbDescriptors((c as { photos: unknown }).photos) } as Checkin;
    });
    const outstanding = outstandingOf(
      r.quantity,
      checkins.map((c) => ({ quantity: c.quantity })),
    );
    const base = camelcaseKeys(
      // strip the joined relations before camelizing the checkout row
      Object.fromEntries(
        Object.entries(r).filter(
          ([k]) => !['device', 'checked_out_by_user', 'checkins'].includes(k),
        ),
      ) as Record<string, unknown>,
    );
    return {
      ...(base as unknown as CheckoutWithDetail),
      deviceCode: r.device?.code ?? '—',
      deviceName: r.device?.name ?? '—',
      checkedOutByName: r.checked_out_by_user?.name ?? null,
      checkins,
      outstanding,
      status: checkoutStatus(outstanding, r.expected_return_date),
    };
  });
};

export const getDeviceCheckoutsQueryOptions = (deviceId: string | undefined) =>
  queryOptions({
    queryKey: [...getCheckoutsQueryOptions().queryKey, 'device', deviceId],
    queryFn: deviceId ? () => getDeviceCheckouts(deviceId) : skipToken,
  });

export const useDeviceCheckouts = (deviceId: string | undefined) =>
  useQuery({
    ...getDeviceCheckoutsQueryOptions(deviceId),
    ...(deviceId ? {} : { enabled: false }),
  });
```

- [ ] **Step 2: Write `get-device-loan-status.ts`**

```ts
import { queryOptions, skipToken, useQuery } from '@tanstack/react-query';
import camelcaseKeys from 'camelcase-keys';

import { createClient } from '@/lib/supabase/client';

import { getCheckoutsQueryOptions } from './get-checkouts';

import type { DeviceLoanStatus } from '../types/checkout';

export const fetchLoanStatusFor = async (deviceIds: string[]): Promise<DeviceLoanStatus[]> => {
  if (deviceIds.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from('device_loan_status')
    .select('*')
    .in('device_id', deviceIds);
  if (error) throw error;
  return camelcaseKeys(data) as DeviceLoanStatus[];
};

export const getDeviceLoanStatusQueryOptions = (deviceId: string | undefined) =>
  queryOptions({
    queryKey: [...getCheckoutsQueryOptions().queryKey, 'loan-status', deviceId],
    queryFn: deviceId
      ? async () => (await fetchLoanStatusFor([deviceId]))[0] ?? null
      : skipToken,
  });

export const useDeviceLoanStatus = (deviceId: string | undefined) =>
  useQuery({
    ...getDeviceLoanStatusQueryOptions(deviceId),
    ...(deviceId ? {} : { enabled: false }),
  });
```

- [ ] **Step 3: Type-check + commit**

Run (from `client/`): `pnpm build`
Expected: compiles.

```bash
git add client/src/features/checkouts/api/get-checkouts.ts client/src/features/checkouts/api/get-device-loan-status.ts
git commit -m "feat(fe/checkouts): read queries (list, device checkouts, loan status)"
```

---

### Task B3: Media helper + mutations (create checkout, check-in)

**Files:**
- Create: `client/src/features/checkouts/api/checkout-media.ts`
- Create: `client/src/features/checkouts/api/create-checkout.ts`
- Create: `client/src/features/checkouts/api/check-in.ts`

**Interfaces:**
- Consumes B1/B2; `toDbDescriptor` from `@/features/devices/api/media-descriptor`; `MediaEntry` from `@/features/devices/components/use-device-media`; `getDevicesQueryOptions`/`getDeviceQueryOptions` from devices api.
- Produces `uploadCheckoutPhoto(prefix, file, sortOrder)`, `commitCheckoutPhotos(prefix, entries)`, `useCreateCheckout()`, `useCheckIn()`.

- [ ] **Step 1: Write `checkout-media.ts`** (mirrors `features/devices/api/device-media.ts`, bucket-scoped to `checkout-photos`)

```ts
import { createClient } from '@/lib/supabase/client';
import type { MediaEntry } from '@/features/devices/components/use-device-media';
import type { CheckoutFileDescriptor } from '../types/checkout';
import { CHECKOUT_PHOTOS_BUCKET } from '../constants/checkout';

function extFor(file: File): string {
  const fromName = file.name.includes('.') ? file.name.split('.').pop() : '';
  return (fromName || file.type.split('/')[1] || 'bin').toLowerCase();
}

export async function uploadCheckoutPhoto(
  prefix: string,
  file: File,
  sortOrder: number,
): Promise<CheckoutFileDescriptor> {
  const supabase = createClient();
  const path = `${prefix}/${crypto.randomUUID()}.${extFor(file)}`;
  const { error } = await supabase.storage
    .from(CHECKOUT_PHOTOS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return {
    path,
    fileName: file.name,
    sizeBytes: file.size,
    mimeType: file.type,
    sortOrder,
    uploadedAt: new Date().toISOString(),
  };
}

// Upload all pending entries under `prefix`; return descriptors in order.
export async function commitCheckoutPhotos(
  prefix: string,
  entries: MediaEntry[],
): Promise<CheckoutFileDescriptor[]> {
  const out: CheckoutFileDescriptor[] = [];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e.kind === 'existing') out.push({ ...e.descriptor, sortOrder: i });
    else out.push(await uploadCheckoutPhoto(prefix, e.file, i));
  }
  return out;
}
```

- [ ] **Step 2: Write `create-checkout.ts`**

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createClient } from '@/lib/supabase/client';
import type { MutationConfig } from '@/lib/react-query';
import type { MediaEntry } from '@/features/devices/components/use-device-media';
import { toDbDescriptor } from '@/features/devices/api/media-descriptor';
import { getDevicesQueryOptions } from '@/features/devices/api/get-paginated-devices';
import { getDeviceQueryOptions } from '@/features/devices/api/get-device';

import { checkoutFormSchema, type CheckoutFormValues } from '../validations/checkout';
import { commitCheckoutPhotos } from './checkout-media';
import { getCheckoutsQueryOptions } from './get-checkouts';

export const createCheckout = async (args: {
  deviceId: string;
  values: CheckoutFormValues;
  photos: MediaEntry[];
}): Promise<string> => {
  const supabase = createClient();
  const v = checkoutFormSchema.parse(args.values);

  // 1. insert the checkout (checked_out_by / checked_out_at filled by DB defaults)
  const { data, error } = await supabase
    .from('checkouts')
    .insert({
      device_id: args.deviceId,
      borrower_name: v.borrowerName,
      quantity: v.quantity,
      expected_return_date: v.expectedReturnDate || null,
      notes: v.notes || null,
    })
    .select('id')
    .single();
  if (error) throw error;
  const checkoutId = data.id;

  // 2. upload photos under the checkout id, then patch the row
  if (args.photos.length > 0) {
    const descriptors = await commitCheckoutPhotos(checkoutId, args.photos);
    const { error: upErr } = await supabase
      .from('checkouts')
      .update({ photos: descriptors.map(toDbDescriptor) })
      .eq('id', checkoutId);
    if (upErr) throw upErr;
  }
  return checkoutId;
};

type Options = { mutationConfig?: MutationConfig<typeof createCheckout> };

export const useCreateCheckout = ({ mutationConfig }: Options = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = mutationConfig ?? {};
  return useMutation({
    mutationFn: createCheckout,
    onSuccess: (...a) => {
      queryClient.invalidateQueries({ queryKey: getCheckoutsQueryOptions().queryKey });
      queryClient.invalidateQueries({ queryKey: getDevicesQueryOptions().queryKey });
      queryClient.invalidateQueries({ queryKey: getDeviceQueryOptions(a[1].deviceId).queryKey });
      onSuccess?.(...a);
    },
    ...rest,
  });
};
```

- [ ] **Step 3: Write `check-in.ts`** (uploads photos, then calls the RPC)

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createClient } from '@/lib/supabase/client';
import type { MutationConfig } from '@/lib/react-query';
import type { MediaEntry } from '@/features/devices/components/use-device-media';
import { toDbDescriptor } from '@/features/devices/api/media-descriptor';
import { getDevicesQueryOptions } from '@/features/devices/api/get-paginated-devices';
import { getDeviceQueryOptions } from '@/features/devices/api/get-device';

import { checkInFormSchema, type CheckInFormValues } from '../validations/checkout';
import { commitCheckoutPhotos } from './checkout-media';
import { getCheckoutsQueryOptions } from './get-checkouts';

export const checkIn = async (args: {
  checkoutId: string;
  deviceId: string; // for cache invalidation
  values: CheckInFormValues;
  photos: MediaEntry[];
}): Promise<void> => {
  const supabase = createClient();
  const v = checkInFormSchema.parse(args.values);

  const descriptors =
    args.photos.length > 0
      ? await commitCheckoutPhotos(`${args.checkoutId}/checkins`, args.photos)
      : [];

  const { error } = await supabase.rpc('check_in', {
    p_checkout_id: args.checkoutId,
    p_outcome: v.outcome,
    p_quantity: v.quantity,
    p_condition: v.outcome === 'normal' && v.condition !== '' ? Number(v.condition) : null,
    p_photos: descriptors.map(toDbDescriptor),
    p_notes: v.notes || null,
    p_split: v.outcome === 'normal' && v.split,
    p_split_code: v.splitCode || null,
  });
  if (error) throw error;
};

type Options = { mutationConfig?: MutationConfig<typeof checkIn> };

export const useCheckIn = ({ mutationConfig }: Options = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = mutationConfig ?? {};
  return useMutation({
    mutationFn: checkIn,
    onSuccess: (...a) => {
      queryClient.invalidateQueries({ queryKey: getCheckoutsQueryOptions().queryKey });
      queryClient.invalidateQueries({ queryKey: getDevicesQueryOptions().queryKey });
      queryClient.invalidateQueries({ queryKey: getDeviceQueryOptions(a[1].deviceId).queryKey });
      onSuccess?.(...a);
    },
    ...rest,
  });
};
```

- [ ] **Step 4: Type-check + commit**

Run (from `client/`): `pnpm build`
Expected: compiles.

```bash
git add client/src/features/checkouts/api/checkout-media.ts client/src/features/checkouts/api/create-checkout.ts client/src/features/checkouts/api/check-in.ts
git commit -m "feat(fe/checkouts): checkout-media + create-checkout + check-in mutations"
```

---

## Phase C — UI

> Design-first: Task C1 runs the ui-ux design pass; C2–C7 implement against it, reusing existing primitives (`PageLayout`, `DataTable`, shadcn `Dialog`/`Field`, the device photo-field + date-picker). Add any missing shadcn primitive with `pnpm dlx shadcn@latest add <name>`.

### Task C1: UI design pass (ui-ux design skill)

**Files:**
- Create: `docs/superpowers/notes/2026-07-10-checkouts-ui.md` (design decisions)

- [ ] **Step 1: Invoke the design skill**

Invoke **ui-ux-pro-max** (or `frontend-design`) with the four surfaces and the project's "Instrument Console" tokens (deep-ink sidebar, teal `--primary`, status tokens, `font-mono tabular-nums` for codes/counts). Ask it to produce concrete component structure + class direction for:
1. `/checkouts` page — status filter tabs, table, overdue emphasis.
2. Check-out dialog.
3. Check-in dialog — outcome selector driving conditional fields (condition + split only for `normal`).
4. Device-detail Checkouts panel — availability line, active-checkout rows with Check-in action, history.

- [ ] **Step 2: Write the decisions to the notes file, then commit**

```bash
git add docs/superpowers/notes/2026-07-10-checkouts-ui.md
git commit -m "docs(checkouts): UI design decisions"
```

---

### Task C2: Check-out dialog

**Files:**
- Create: `client/src/features/checkouts/components/checkout-dialog.tsx`
- Reference (mirror): `client/src/features/devices/components/device-form.tsx` (TanStack Form + shadcn `Field` + `@/lib/form/field-error`), `device-photos-field.tsx`, the date-picker field used there.

**Interfaces:**
- Consumes `useCreateCheckout` (B3), `useDeviceMedia` (`@/features/devices/components/use-device-media`), `checkoutFormSchema`/`CHECKOUT_FORM_DEFAULTS` (B1).
- Produces `<CheckoutDialog deviceId available open onOpenChange />` — `available: number` caps quantity; on success it closes and shows a success toast (`sonner`).

- [ ] **Step 1: Build the dialog**

A shadcn `Dialog` wrapping a TanStack Form (mirror `device-form.tsx` exactly for the Field + zod wiring). Fields: `borrowerName` (text, required), `quantity` (number, `min=1 max={available}`), `expectedReturnDate` (date-picker, optional), photos (reuse the device photo-field with a `useDeviceMedia([], { withPreview: true })` instance), `notes` (textarea). Submit calls `useCreateCheckout().mutateAsync({ deviceId, values, photos: media.entries })`; on success close + `toast.success(t('checkouts.checkedOut'))`. Disable submit when `available <= 0`. All labels from the `checkouts` i18n namespace.

- [ ] **Step 2: Verify build + commit**

Run (from `client/`): `pnpm lint:fix && pnpm build`
Expected: compiles, no lint errors.

```bash
git add client/src/features/checkouts/components/checkout-dialog.tsx
git commit -m "feat(fe/checkouts): check-out dialog"
```

---

### Task C3: Check-in dialog

**Files:**
- Create: `client/src/features/checkouts/components/check-in-dialog.tsx`

**Interfaces:**
- Consumes `useCheckIn` (B3), `useDeviceMedia`, `checkInFormSchema`/`CHECK_IN_FORM_DEFAULTS`, `CHECKIN_OUTCOMES`/`CHECKIN_OUTCOME_LABEL_KEY` (B1).
- Produces `<CheckInDialog checkout open onOpenChange />` where `checkout: CheckoutWithDetail` supplies `outstanding`, `id`, `deviceId`.

- [ ] **Step 1: Build the dialog**

A shadcn `Dialog` + TanStack Form. Show `outstanding` at top. Fields:
- `outcome` — a segmented control / radio (`RadioGroup`) over `CHECKIN_OUTCOMES`, labels via `CHECKIN_OUTCOME_LABEL_KEY`.
- `quantity` — number, `min=1 max={checkout.outstanding}`.
- **Only when `outcome === 'normal'`** (read the field value reactively): `condition` (number 0–100, optional), the split toggle (`Switch`, `split`), and — when `split` is on — `splitCode` (text; optionally pre-fill via `getNextDeviceCode()` from devices api, editable).
- `photos` (reuse device photo-field), `notes` (textarea) — always shown.

Submit calls `useCheckIn().mutateAsync({ checkoutId: checkout.id, deviceId: checkout.deviceId, values, photos: media.entries })`. On the RPC error whose message includes `exceeds outstanding` show an inline error. On success close + `toast.success(t('checkouts.checkedIn'))`. (No duplicate-code handling — device codes are non-unique.)

- [ ] **Step 2: Verify build + commit**

Run (from `client/`): `pnpm lint:fix && pnpm build`
Expected: compiles.

```bash
git add client/src/features/checkouts/components/check-in-dialog.tsx
git commit -m "feat(fe/checkouts): check-in dialog (outcome-driven fields)"
```

---

### Task C4: Device-detail Checkouts panel + integration

**Files:**
- Create: `client/src/features/checkouts/components/checkouts-panel.tsx`
- Modify: `client/src/features/devices/components/device-detail-client.tsx` (add the panel as a main-column `Section`)

**Interfaces:**
- Consumes `useDeviceCheckouts` (B2), `useDeviceLoanStatus` (B2), `CheckoutDialog` (C2), `CheckInDialog` (C3), `deviceMediaUrl` pattern for photo thumbnails (`/api/device-media/checkout-photos/<path>`).
- Produces `<CheckoutsPanel deviceId />`.

- [ ] **Step 1: Build `checkouts-panel.tsx`**

Renders:
- Availability line from `useDeviceLoanStatus(deviceId)`: `t('checkouts.availability', { available, total, onLoan })` e.g. *"3 of 5 available · 2 checked out"*.
- A **Check out** button (opens `CheckoutDialog`, `available` from loan status; disabled when `available <= 0`).
- Active checkouts (`status !== 'closed'`) from `useDeviceCheckouts(deviceId)`: borrower, `outstanding`/`quantity`, checked-out-by, expected-return with an **overdue** badge when `status === 'overdue'`, and a **Check in** button (opens `CheckInDialog` for that checkout).
- Per checkout, a collapsible check-in history: each checkin's outcome badge (`CHECKIN_OUTCOME_LABEL_KEY`), quantity, condition, and photo thumbnails via the media proxy URL.

- [ ] **Step 2: Integrate into `device-detail-client.tsx`**

Add a `<Section icon={...} title={t('sectionCheckouts')}>` block in the main column (near the Media section), rendering `<CheckoutsPanel deviceId={deviceId} />`. Import `CheckoutsPanel`. (Mirror the existing `<Section>` usage.)

- [ ] **Step 3: Verify build + commit**

Run (from `client/`): `pnpm lint:fix && pnpm build`
Expected: compiles.

```bash
git add client/src/features/checkouts/components/checkouts-panel.tsx client/src/features/devices/components/device-detail-client.tsx
git commit -m "feat(fe/checkouts): device-detail checkouts panel"
```

---

### Task C5: Devices list "N out" badge

**Files:**
- Modify: `client/src/features/devices/components/devices-client.tsx` (fetch loan status for the visible rows)
- Modify: `client/src/features/devices/components/devices-columns.tsx` (render the badge)

**Interfaces:**
- Consumes `fetchLoanStatusFor` (B2).

- [ ] **Step 1: Fetch loan status for the page's devices**

In `devices-client.tsx`, after the devices query resolves, add a query keyed on the visible device ids: `useQuery({ queryKey: [...getCheckoutsQueryOptions().queryKey, 'loan-status', ids], queryFn: () => fetchLoanStatusFor(ids), enabled: ids.length > 0 })`. Build a `Map<deviceId, onLoan>` and pass it into `deviceColumns(...)`.

- [ ] **Step 2: Render the badge**

In `devices-columns.tsx`, in the `name` (or `code`) cell, when `onLoan > 0` render a compact badge `t('checkouts.nOut', { n: onLoan })` with a subtle tone (mirror existing badge styling; `font-mono tabular-nums`).

- [ ] **Step 3: Verify build + commit**

Run (from `client/`): `pnpm lint:fix && pnpm build`
Expected: compiles.

```bash
git add client/src/features/devices/components/devices-client.tsx client/src/features/devices/components/devices-columns.tsx
git commit -m "feat(fe/devices): checked-out badge on device list"
```

---

### Task C6: `/checkouts` page + nav + i18n

**Files:**
- Create: `client/src/app/(app)/checkouts/page.tsx`
- Create: `client/src/features/checkouts/components/checkouts-client.tsx`
- Create: `client/src/features/checkouts/components/checkouts-columns.tsx`
- Modify: `client/src/components/app/nav-items.ts` (add the Checkouts item)
- Modify: `client/messages/en.json` + `client/messages/vi.json` (add the `checkouts` namespace + nav labels)

**Interfaces:**
- Consumes `useCheckoutsList` (B2), `CHECKOUT_STATUS_LABEL_KEY` (B1), `DataTable`/`PageLayout` (app components), `CheckInDialog` (C3).

- [ ] **Step 1: Add i18n strings**

In `en.json` add a `checkouts` namespace with: `title`, `description`, `newCheckout`, `checkedOut`, `checkedIn`, column headers (`colDevice`, `colBorrower`, `colQty`, `colBy`, `colDate`, `colExpected`, `colStatus`), `statusOutstanding`/`statusOverdue`/`statusClosed`, `outcomeNormal`/`outcomeConsumed`/`outcomeOther`, `availability`, `nOut`, `checkIn`, `checkOut`, `borrower`, `quantity`, `expectedReturn`, `condition`, `splitToggle`, `splitCode`, `notes`, `photos`. In `nav` add `checkouts` + `checkoutsDesc`. Add matching validation keys (`validation.borrowerRequired`, `validation.checkinOutcomeShape`). Mirror all keys in `vi.json` with Vietnamese (outcomeConsumed = "Tiêu hao", outcomeOther = "Khác/Mất", etc.).

- [ ] **Step 2: Add the nav item**

In `nav-items.ts` add `{ labelKey: 'checkouts', descKey: 'checkoutsDesc', href: '/checkouts', icon: <pick a lucide icon, e.g. ArrowLeftRight> }` after the Devices item.

- [ ] **Step 3: Build the columns + client**

`checkouts-columns.tsx`: `ColumnDef<CheckoutListItem>[]` — device (link to `/devices/${deviceId}`, `font-mono` code + name), borrower, `outstanding/quantity` (tabular-nums), checked-out-by, checked-out-at, expected-return, a status badge from `CHECKOUT_STATUS_LABEL_KEY` (overdue tone = `status-retired`), and a Check-in action for non-closed rows (opens `CheckInDialog`).
`checkouts-client.tsx`: mirror `devices-client.tsx` — `PageLayout` + `DataTable` with a global search (`buildCheckoutSearch` over device code/name + borrower) and status filter tabs (`outstanding` / `overdue` / `closed` / all).

- [ ] **Step 4: Build the route page**

`page.tsx`:

```tsx
import { Suspense } from 'react';

import { CheckoutsClient } from '@/features/checkouts/components/checkouts-client';

export default function CheckoutsPage() {
  return (
    <Suspense>
      <CheckoutsClient />
    </Suspense>
  );
}
```

- [ ] **Step 5: Verify build + commit**

Run (from `client/`): `pnpm lint:fix && pnpm build`
Expected: compiles; `/checkouts` renders; nav shows Checkouts.

```bash
git add "client/src/app/(app)/checkouts" client/src/features/checkouts/components/checkouts-client.tsx client/src/features/checkouts/components/checkouts-columns.tsx client/src/components/app/nav-items.ts client/messages/en.json client/messages/vi.json
git commit -m "feat(fe/checkouts): /checkouts page + nav + i18n"
```

---

### Task C7: Surface checkout/check-in events in the device activity feed

**Files:**
- Modify: `client/src/features/devices/api/get-device-activity.ts` (also fetch checkout/checkin activity for the device)
- Modify: `client/src/features/devices/components/device-activity-feed.tsx` (render checkout/checkin entries)

**Interfaces:**
- Consumes `activities` rows with `entity_type in ('checkouts','checkins')`.

- [ ] **Step 1: Extend `get-device-activity.ts`**

The `log_activity` trigger already logs checkouts/checkins (Task A1). Their `entity_id` is the checkout/checkin id, not the device id — so resolve ids first, then query. In `getDeviceActivity(deviceId)`:
1. Fetch the device's checkout ids: `select id from checkouts where device_id = deviceId`.
2. Fetch checkin ids for those checkouts: `select id from checkins where checkout_id in (...)`.
3. Query `activities` with `.or('and(entity_type.eq.devices,entity_id.eq.<deviceId>),and(entity_type.eq.checkouts,entity_id.in.(<checkoutIds>)),and(entity_type.eq.checkins,entity_id.in.(<checkinIds>)))'`, ordered by `created_at desc`, limited.
Add `entityType` to `DeviceActivityEntry`. (When there are no checkout ids, keep the original devices-only query.)

- [ ] **Step 2: Render checkout/checkin entries**

In `device-activity-feed.tsx`, extend `describe()` and the icon/tone maps to handle `entityType`:
- `checkouts` insert → `t('checkouts.activityCheckedOut', { borrower: after.borrower_name })`; delete → `activityCheckoutRemoved`.
- `checkins` insert → `t('checkouts.activityCheckedIn', { qty: after.quantity, outcome: tRoot(CHECKIN_OUTCOME_LABEL_KEY[after.outcome]) })`.
Pick a lucide icon (e.g. `ArrowLeftRight`) + a neutral tone for these. Add the `checkouts.activity*` keys to en/vi.

- [ ] **Step 3: Verify build + commit**

Run (from `client/`): `pnpm lint:fix && pnpm build`
Expected: compiles.

```bash
git add client/src/features/devices/api/get-device-activity.ts client/src/features/devices/components/device-activity-feed.tsx client/messages/en.json client/messages/vi.json
git commit -m "feat(fe/checkouts): surface checkout/checkin events in device activity feed"
```

---

## Phase D — Verification

### Task D1: End-to-end verification via Playwright MCP

**Files:** none (manual/driven verification per project convention — the client has no unit tests).

- [ ] **Step 1: Start the app + sign in**

Ensure Supabase local is running and `supabase db reset` has been applied. Start the client (`pnpm dev` from `client/`). Sign in with the dev-admin seed account.

- [ ] **Step 2: Drive the core flows (desktop 1280px + mobile 390px)**

Using Playwright MCP, verify and read the console log at each step:
1. On a device with `quantity ≥ 5`, open the Checkouts panel → **Check out** 2 units to a borrower with an expected return date + a photo. Confirm availability updates to *"3 of 5 available · 2 checked out"* and the device list shows a *"2 out"* badge.
2. **Check in — normal merge:** 1 unit at condition 70. Confirm device condition becomes 70, quantity stays 5, outstanding drops to 1.
3. **Check in — normal split:** 1 unit at condition 40 with the split toggle on. Confirm a new device record exists (next `DEV-###`, quantity 1, condition 40) linked via provenance, source quantity now 4.
4. **Check in — consumed (tiêu hao):** with a fresh checkout, consume 1 unit → device quantity decrements, outcome shows "Tiêu hao".
5. **Overdue:** create a checkout with a past expected-return date → `/checkouts` shows it under **Overdue** with the overdue badge.
6. Confirm the check-out/check-in entries appear in the device activity feed.

- [ ] **Step 3: Confirm no console errors**

Read the browser console after each flow; there must be no errors/warnings introduced by these screens.

---

### Task D2: Full test + lint/build/format gate

- [ ] **Step 1: Database tests**

Run (repo root): `supabase test db`
Expected: all pgTAP files pass, including `09`–`12`.

- [ ] **Step 2: Client gate**

Run (from `client/`): `pnpm lint:fix` → `pnpm build` → `pnpm run format:fix`
Expected: all pass; if anything fails, fix and re-run from the start.

- [ ] **Step 3: Final commit (if formatter changed anything)**

```bash
git add -A
git commit -m "chore(checkouts): format + final gate"
```

---

## Self-review notes

- **Spec coverage:** checkouts/checkins tables + provenance column (A1); availability invariant (A2); `check_in` RPC with all outcomes + split + installments (A3); derived availability view (A4); storage bucket + proxy (A5); types (A6); API layer (B1–B3); all five UI surfaces (C2–C6); activity feed (C7); pgTAP + Playwright + gate (D1–D2). Out-of-scope items (member links, notifications, standalone split) intentionally excluded.
- **Resolved during planning:** `devices.code` is non-unique (constraint dropped by an earlier migration), so the split path needs no code-collision handling.
