-- ============================================================
-- activities — append-only audit log.
-- Written automatically by the public.log_activity() AFTER trigger
-- attached to every business table. before/after are full row
-- snapshots (jsonb), so any field-level diff is reconstructable.
-- Rows are immutable: no updated_at, no deleted_at, no update/delete
-- policies.
-- ============================================================

create type public.activity_action as enum ('insert', 'update', 'delete', 'restore');

create table public.activities (
  id            uuid primary key default gen_random_uuid(),
  actor_id      uuid references public.users(id) on delete set null,
  action        public.activity_action not null,
  entity_type   text not null,
  entity_id     uuid,
  entity_label  text,
  before        jsonb not null default '{}'::jsonb,
  after         jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index activities_created_idx on public.activities(created_at desc);
create index activities_entity_idx  on public.activities(entity_type, entity_id, created_at desc);
create index activities_actor_idx   on public.activities(actor_id, created_at desc);

alter table public.activities enable row level security;

-- Read: any authenticated user.
-- Insert: only via the SECURITY DEFINER private.log_activity() trigger,
--   which bypasses RLS by design.
-- No update / delete policies — rows are immutable.
create policy activities_read on public.activities
  for select to authenticated
  using (true);
