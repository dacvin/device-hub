-- ============================================================
-- DeviceHub — org settings + per-user prefs + devices_with_flags()
-- ============================================================

create table org_settings (
  id                              boolean primary key default true check (id),

  org_name                        text not null default 'DeviceHub',
  primary_site                    text,
  date_format                     text not null default 'DD MMM YYYY',

  code_prefix                     text not null default 'DEV-',
  code_autogenerate               boolean not null default true,
  default_inventory_cycle_months  int not null default 12 check (default_inventory_cycle_months between 1 and 120),

  condition_good_pct              int not null default 70 check (condition_good_pct between 0 and 100),
  condition_fair_pct              int not null default 40 check (condition_fair_pct between 0 and 100),
  check (condition_fair_pct <= condition_good_pct),

  warranty_expiring_days          int not null default 90 check (warranty_expiring_days between 1 and 365),

  notify_warranty                 boolean not null default true,
  notify_inventory_overdue        boolean not null default true,
  notify_weekly_summary           boolean not null default true,
  notify_new_device               boolean not null default false,

  export_format                   text not null default 'CSV' check (export_format in ('CSV', 'XLSX', 'PDF')),
  deleted_retention_days          int not null default 30 check (deleted_retention_days between 0 and 3650),

  updated_by                      uuid references member(id) on delete set null,
  updated_at                      timestamptz not null default now()
);

insert into org_settings (id) values (true);

create table user_preference (
  user_id              uuid primary key references member(id) on delete cascade,
  theme                text not null default 'system' check (theme in ('light', 'dark', 'system')),
  default_device_view  text not null default 'table'  check (default_device_view in ('table', 'cards')),
  mono_codes           boolean not null default true,
  updated_at           timestamptz not null default now()
);

create function devices_with_flags(p_warranty_days int default 90)
returns table (
  id                     uuid,
  code                   text,
  name                   text,
  group_id               uuid,
  department_id          uuid,
  manufacturer_id        uuid,
  model                  text,
  serial_number          text,
  specifications         text,
  notes                  text,
  condition              int,
  location               text,
  quantity               int,
  unit                   unit,
  source                 device_source,
  import_date            date,
  last_check_date        date,
  inventory_cycle_months int,
  warranty_start         date,
  warranty_end           date,
  status                 device_status,
  cover_photo_id         uuid,
  deleted_at             timestamptz,
  created_at             timestamptz,
  updated_at             timestamptz,
  flag_warranty_expiring boolean,
  flag_inventory_overdue boolean
)
language sql stable security invoker as $$
  select d.*,
    (d.status <> 'retired'
     and d.warranty_end is not null
     and d.warranty_end >= current_date
     and d.warranty_end <= current_date + (p_warranty_days || ' days')::interval) as flag_warranty_expiring,
    (d.status <> 'retired'
     and d.last_check_date is not null
     and d.last_check_date < current_date
         - (d.inventory_cycle_months || ' months')::interval)                     as flag_inventory_overdue
  from device d;
$$;
