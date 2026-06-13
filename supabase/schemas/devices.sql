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

create type public.device_status as enum ('in-use', 'in-storage', 'in-repair', 'retired');
create type public.device_source as enum ('Purchased', 'Leased', 'Donated', 'Transferred');

create table public.devices (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  name            text not null,

  group_id        uuid not null references public.groups(id)        on delete restrict,
  unit_id         uuid not null references public.units(id)         on delete restrict,
  manufacturer_id uuid          references public.manufacturers(id) on delete set null,

  model           text,
  serial_number   text,
  specifications  text,
  notes           text,

  condition       int  not null default 100 check (condition between 0 and 100),
  location        text,
  quantity        int  not null default 1   check (quantity >= 1),
  source          public.device_source,
  status          public.device_status not null default 'in-storage',

  import_date            date,
  last_check_date        date,
  inventory_cycle_months int  not null default 12 check (inventory_cycle_months between 1 and 120),
  warranty_start         date,
  warranty_end           date,

  photos     jsonb not null default '[]'::jsonb check (jsonb_typeof(photos) = 'array'),
  documents  jsonb not null default '[]'::jsonb check (jsonb_typeof(documents) = 'array'),

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,

  check (warranty_end is null or warranty_start is null or warranty_end >= warranty_start)
);

create index devices_group_idx        on public.devices(group_id);
create index devices_unit_idx         on public.devices(unit_id);
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
