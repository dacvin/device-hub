-- ============================================================
-- devices — the asset table.
-- photos / documents are JSONB arrays of file descriptors instead of
-- separate child tables. Each entry shape:
--   { "path": "DEV-001-1.jpg", "file_name": "front.jpg",
--     "size_bytes": 12345, "mime_type": "image/jpeg",
--     "sort_order": 0, "uploaded_at": "2026-06-13T…" }
-- For photos, sort_order = 0 is the cover. `path` is the in-bucket
-- key for device-photos / device-documents.
-- ============================================================

-- 'checked_out' is automation-only: set/cleared by the checkout sync trigger
-- (see checkouts.sql), never picked manually. 'lost' can be set manually or by
-- a lost check-in draining the device to 0.
create type public.device_status as enum ('checked_out', 'storage', 'repair', 'retired', 'lost');
-- 'device' = serialized single asset (quantity locked to ≤ 1);
-- 'accessory' = bulk stock (quantity counts units, may hit 0 when depleted).
create type public.device_type as enum ('device', 'accessory');
create type public.device_source as enum ('Purchased', 'Leased', 'Donated', 'Transferred');
-- Quantity unit. Stored as an English slug; the UI localizes the label (VI/EN)
-- the same way device_status does. Was a `units` catalog table; promoted to an
-- enum since the set is small and stable.
create type public.device_unit as enum ('piece', 'set', 'unit', 'box', 'item');

create table public.devices (
  id              uuid primary key default gen_random_uuid(),
  code            text not null,
  name            text not null,

  group_id        uuid not null references public.groups(id)        on delete restrict,
  unit            public.device_unit not null default 'piece',
  manufacturer_id uuid not null references public.manufacturers(id) on delete restrict,

  model           text,
  serial_number   text,
  specifications  text,
  notes           text,

  condition       int  not null default 100 check (condition between 0 and 100),
  location        text,
  quantity        int  not null default 1   check (quantity >= 0),
  type            public.device_type not null default 'device',
  source          public.device_source,
  status          public.device_status not null default 'storage',

  import_date            date,
  last_check_date        date,
  inventory_cycle_months int  not null default 12 check (inventory_cycle_months between 1 and 120),
  warranty_start         date,
  warranty_end           date,

  photos     jsonb not null default '[]'::jsonb check (jsonb_typeof(photos) = 'array'),
  documents  jsonb not null default '[]'::jsonb check (jsonb_typeof(documents) = 'array'),
  -- provenance: set when this record was split off from another device on check-in
  split_from_device_id uuid references public.devices(id) on delete set null,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,

  check (warranty_end is null or warranty_start is null or warranty_end >= warranty_start),
  -- serialized devices hold at most one unit (0 after a lost/consumed drain)
  constraint devices_type_quantity_check check (type = 'accessory' or quantity <= 1)
);

create index devices_group_idx        on public.devices(group_id);
create index devices_manufacturer_idx on public.devices(manufacturer_id);
create index devices_active_idx       on public.devices(deleted_at) where deleted_at is null;
create index devices_status_idx       on public.devices(status);

alter table public.devices enable row level security;

create trigger devices_set_updated_at
  before update on public.devices
  for each row execute function public.set_updated_at();

create trigger devices_log_activity
  after insert or update or delete on public.devices
  for each row execute function private.log_activity('name');

-- Access model: any authenticated user has full CRUD on devices.
-- Members add / edit / soft-delete; admin scoping lives on the users
-- table, not here. See note in groups.sql about advisor warnings.
create policy devices_read   on public.devices for select to authenticated using (true);
create policy devices_insert on public.devices for insert to authenticated with check (true);
create policy devices_update on public.devices for update to authenticated using (true) with check (true);
create policy devices_delete on public.devices for delete to authenticated using (true);

-- No anon access: the policies above are authenticated-only, so strip the
-- default-privilege table grant Supabase auto-applies to anon on new public
-- tables. authenticated keeps its default grants (the RLS policies need them).
revoke all on public.devices from anon;
