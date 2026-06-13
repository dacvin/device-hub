-- ============================================================
-- units — quantity units (piece, set, box, ...)
-- Promoted from a hard-coded enum to a table so admins can add new
-- units without a migration.
-- ============================================================

create table public.units (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  abbreviation  text,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index units_active_idx on public.units(deleted_at) where deleted_at is null;

alter table public.units enable row level security;

create trigger units_set_updated_at
  before update on public.units
  for each row execute function public.set_updated_at();

create trigger units_log_activity
  after insert or update or delete on public.units
  for each row execute function private.log_activity('name');

-- Shared catalog, no ownership. See note in groups.sql.
create policy units_read   on public.units for select to authenticated using (true);
create policy units_insert on public.units for insert to authenticated with check (true);
create policy units_update on public.units for update to authenticated using (true) with check (true);
create policy units_delete on public.units for delete to authenticated using (true);
