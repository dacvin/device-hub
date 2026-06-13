-- ============================================================
-- groups — device categories (Laptop, Monitor, Server, ...)
-- ============================================================

create table public.groups (
  id                             uuid primary key default gen_random_uuid(),
  name                           text not null unique,
  icon                           text,
  default_inventory_cycle_months int  not null default 12 check (default_inventory_cycle_months between 1 and 120),

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index groups_active_idx on public.groups(deleted_at) where deleted_at is null;

alter table public.groups enable row level security;

create trigger groups_set_updated_at
  before update on public.groups
  for each row execute function public.set_updated_at();

create trigger groups_log_activity
  after insert or update or delete on public.groups
  for each row execute function private.log_activity('name');

-- Access model: any authenticated user has full CRUD on the shared
-- catalog. There is no per-row ownership concept for groups, so
-- USING (true) / WITH CHECK (true) is intentional. The advisor's
-- "RLS Policy Always True" warnings on INSERT/UPDATE/DELETE here
-- reflect that design, not a bug.
create policy groups_read   on public.groups for select to authenticated using (true);
create policy groups_insert on public.groups for insert to authenticated with check (true);
create policy groups_update on public.groups for update to authenticated using (true) with check (true);
create policy groups_delete on public.groups for delete to authenticated using (true);
