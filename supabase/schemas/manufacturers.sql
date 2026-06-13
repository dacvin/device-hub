-- ============================================================
-- manufacturers — vendor catalog
-- ============================================================

create table public.manufacturers (
  id              uuid primary key default gen_random_uuid(),
  name            text not null unique,
  support_contact text,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index manufacturers_active_idx on public.manufacturers(deleted_at) where deleted_at is null;

alter table public.manufacturers enable row level security;

create trigger manufacturers_set_updated_at
  before update on public.manufacturers
  for each row execute function public.set_updated_at();

create trigger manufacturers_log_activity
  after insert or update or delete on public.manufacturers
  for each row execute function private.log_activity('name');

-- Shared catalog, no ownership. See note in groups.sql.
create policy manufacturers_read   on public.manufacturers for select to authenticated using (true);
create policy manufacturers_insert on public.manufacturers for insert to authenticated with check (true);
create policy manufacturers_update on public.manufacturers for update to authenticated using (true) with check (true);
create policy manufacturers_delete on public.manufacturers for delete to authenticated using (true);
