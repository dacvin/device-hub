-- ============================================================
-- DeviceHub — tables, foreign keys, indexes
-- ============================================================

-- ---- Lookup tables ----
create table department (
  id                uuid primary key default gen_random_uuid(),
  name              text not null unique,
  manager           text,
  primary_location  text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table device_group (
  id                             uuid primary key default gen_random_uuid(),
  name                           text not null unique,
  icon                           text,
  default_inventory_cycle_months int  not null default 12,
  created_at                     timestamptz not null default now(),
  updated_at                     timestamptz not null default now()
);

create table manufacturer (
  id              uuid primary key default gen_random_uuid(),
  name            text not null unique,
  support_contact text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---- Core: device ----
create table device (
  id                     uuid primary key default gen_random_uuid(),
  code                   text not null unique,
  name                   text not null,

  group_id               uuid not null references device_group(id) on delete restrict,
  department_id          uuid not null references department(id)   on delete restrict,
  manufacturer_id        uuid          references manufacturer(id) on delete set null,

  model                  text,
  serial_number          text,
  specifications         text,
  notes                  text,

  condition              int  not null default 100 check (condition between 0 and 100),
  location               text,
  quantity               int  not null default 1 check (quantity >= 1),
  unit                   unit not null default 'piece',
  source                 device_source,

  import_date            date,
  last_check_date        date,
  inventory_cycle_months int  not null default 12,
  warranty_start         date,
  warranty_end           date,

  cover_photo_id         uuid,
  is_retired             boolean not null default false,
  deleted_at             timestamptz,

  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),

  check (warranty_end is null or warranty_start is null or warranty_end >= warranty_start)
);

create index device_group_idx        on device(group_id);
create index device_department_idx   on device(department_id);
create index device_manufacturer_idx on device(manufacturer_id);
create index device_active_idx       on device(deleted_at) where deleted_at is null;

-- ---- Uploaded assets ----
create table device_photo (
  id         uuid primary key default gen_random_uuid(),
  device_id  uuid not null references device(id) on delete cascade,
  url        text not null,
  file_name  text,
  size_bytes bigint check (size_bytes is null or size_bytes <= 5242880),
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);
create index device_photo_device_idx on device_photo(device_id, sort_order);

create table device_document (
  id         uuid primary key default gen_random_uuid(),
  device_id  uuid not null references device(id) on delete cascade,
  url        text not null,
  file_name  text not null,
  mime_type  text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);
create index device_document_device_idx on device_document(device_id);

-- Deferred FK (circular: device → device_photo → device)
alter table device
  add constraint device_cover_photo_fk
  foreign key (cover_photo_id) references device_photo(id) on delete set null;
