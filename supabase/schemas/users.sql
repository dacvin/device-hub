-- ============================================================
-- users — app accounts. Decoupled from auth.users so admins can
-- invite someone before they sign up. When the invitee accepts and
-- signs in, auth_user_id is filled and status flips to 'active'.
-- ============================================================

create type public.user_role   as enum ('admin', 'member');
create type public.user_status as enum ('active', 'invited', 'disabled');

create table public.users (
  id              uuid primary key default gen_random_uuid(),
  auth_user_id    uuid unique references auth.users(id) on delete set null,

  name            text not null,
  email           text not null unique,
  phone           text,
  role            public.user_role   not null default 'member',
  status          public.user_status not null default 'invited',

  joined_at       date,
  last_active_at  timestamptz,
  invited_by      uuid references public.users(id) on delete set null,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index users_active_idx       on public.users(deleted_at) where deleted_at is null;
create index users_auth_user_id_idx on public.users(auth_user_id);
create index users_role_idx         on public.users(role);

alter table public.users enable row level security;

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger users_log_activity
  after insert or update or delete on public.users
  for each row execute function private.log_activity('email');


-- ============================================================
-- RLS
-- Read: any authenticated user.
-- Insert: admin only (invite flow).
-- Update: admin can change anything; members can self-update except
--   role / status / auth_user_id / invited_by / deleted_at (pinned to
--   their existing values via subselect).
-- Delete: admin only (soft delete is an update; same rule applies).
--
-- auth.uid() wrapped in (select ...) so PG caches the value once per
-- statement instead of recomputing per row.
-- ============================================================

create policy users_read on public.users
  for select to authenticated
  using (true);

create policy users_insert on public.users
  for insert to authenticated
  with check (public.is_admin());

-- Single UPDATE policy combining admin + self-update. Two separate
-- policies would both apply (PG OR's permissive policies), which the
-- advisor flags as a "Multiple Permissive Policies" issue and adds a
-- small per-row perf cost.
create policy users_update on public.users
  for update to authenticated
  using (
    public.is_admin()
    or auth_user_id = (select auth.uid())
  )
  with check (
    -- Admins can change any field.
    public.is_admin()
    -- Members can update their own row but cannot change role, status,
    -- auth_user_id, invited_by, or deleted_at (pinned via subselect
    -- against their own existing row).
    or (
      auth_user_id = (select auth.uid())
      and role         = (select u.role         from public.users u where u.auth_user_id = (select auth.uid()))
      and status       = (select u.status       from public.users u where u.auth_user_id = (select auth.uid()))
      and auth_user_id is not distinct from (select u.auth_user_id from public.users u where u.auth_user_id = (select auth.uid()))
      and invited_by   is not distinct from (select u.invited_by   from public.users u where u.auth_user_id = (select auth.uid()))
      and deleted_at   is not distinct from (select u.deleted_at   from public.users u where u.auth_user_id = (select auth.uid()))
    )
  );

create policy users_delete on public.users
  for delete to authenticated
  using (public.is_admin());
