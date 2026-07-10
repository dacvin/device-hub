-- ============================================================
-- users — app accounts. Decoupled from auth.users so admins can
-- invite someone before they sign up. When the invitee accepts and
-- signs in, auth_user_id is filled and status flips to 'active'.
-- ============================================================

create type public.user_role   as enum ('admin', 'member');
create type public.user_status as enum ('active', 'invited', 'deactivated');

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

-- Single UPDATE policy. email + role are immutable for ALL authenticated
-- users (admins included) — email is the auth identity anchor and roles are
-- seed/service-role only. Both are pinned by comparing the NEW row to the
-- currently-stored row (keyed on the immutable PK). Members may additionally
-- update only their own row's name + phone; every other field is pinned.
create policy users_update on public.users
  for update to authenticated
  using (
    public.is_admin()
    or auth_user_id = (select auth.uid())
  )
  with check (
    -- Immutable for everyone (compare NEW value to stored value for this row).
    role  = (select u.role  from public.users u where u.id = public.users.id)
    and email = (select u.email from public.users u where u.id = public.users.id)
    and (
      -- Admins may change any remaining field (name, phone, status).
      public.is_admin()
      -- Members may update only their own row; name + phone only, everything
      -- else pinned to their existing values.
      or (
        auth_user_id = (select auth.uid())
        and status         = (select u.status         from public.users u where u.auth_user_id = (select auth.uid()))
        and auth_user_id   is not distinct from (select u.auth_user_id   from public.users u where u.auth_user_id = (select auth.uid()))
        and invited_by     is not distinct from (select u.invited_by     from public.users u where u.auth_user_id = (select auth.uid()))
        and deleted_at     is not distinct from (select u.deleted_at     from public.users u where u.auth_user_id = (select auth.uid()))
        and joined_at      is not distinct from (select u.joined_at      from public.users u where u.auth_user_id = (select auth.uid()))
        and last_active_at is not distinct from (select u.last_active_at from public.users u where u.auth_user_id = (select auth.uid()))
      )
    )
  );

create policy users_delete on public.users
  for delete to authenticated
  using (public.is_admin());

-- Link + activate the allowlist row when its auth identity is created.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.link_auth_user();

-- Table-level privileges for PostgREST roles (RLS still filters rows).
-- Supabase auto-grants ALL on new public tables to anon + authenticated via
-- default privileges; strip that first, then grant intentionally. anon gets
-- nothing (no anon-facing access to the allowlist).
revoke all on public.users from anon, authenticated;
grant select, insert, update, delete on public.users to authenticated;
grant all on public.users to service_role;
-- Allow the auth hook (runs as supabase_auth_admin) to query the allowlist.
grant select on public.users to supabase_auth_admin;
