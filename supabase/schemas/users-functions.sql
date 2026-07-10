-- ============================================================
-- users — helper functions used by RLS policies + log_activity.
--
-- SECURITY INVOKER (the default): these helpers don't need to
-- bypass RLS. The caller is `authenticated`, which has SELECT on
-- public.users via the users_read RLS policy — that's enough for
-- the lookup the function performs.
--
-- Living in `public` means they're callable via PostgREST too, but
-- the auth.uid() guard means anon gets only NULL / false back, so
-- there's no information leak.
--
-- SET search_path = '' + fully-qualified references prevent
-- search-path attacks regardless of definer/invoker.
--
-- plpgsql so the body is validated lazily — this file loads BEFORE
-- users.sql so public.users may not exist yet at function creation,
-- but it will by the time the function is first called at runtime.
-- ============================================================

create or replace function public.app_user_id()
returns uuid
language plpgsql
stable
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return null;
  end if;
  return (
    select id
    from public.users
    where auth_user_id = auth.uid()
      and deleted_at is null
    limit 1
  );
end;
$$;

create or replace function public.is_admin()
returns boolean
language plpgsql
stable
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return false;
  end if;
  return exists (
    select 1
    from public.users
    where auth_user_id = auth.uid()
      and role = 'admin'
      and deleted_at is null
  );
end;
$$;

-- ============================================================
-- before_user_created — auth hook. Rejects any signup whose
-- email is not on the allowlist (a non-deleted public.users row).
-- Invited emails pass because the admin inserts the users row
-- BEFORE generating the invite link. Called by supabase_auth_admin,
-- so it needs explicit USAGE + EXECUTE grants (unlike trigger fns).
-- ============================================================
create or replace function private.before_user_created(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_email text := lower(event -> 'user' ->> 'email');
begin
  if v_email is not null and exists (
    select 1 from public.users
    where lower(email) = v_email
      and deleted_at is null
  ) then
    return '{}'::jsonb;  -- allow
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'message', 'This email has not been invited to DeviceHub.',
      'http_code', 403
    )
  );
end;
$$;

grant usage on schema private to supabase_auth_admin;
grant execute on function private.before_user_created(jsonb) to supabase_auth_admin;
revoke execute on function private.before_user_created(jsonb) from anon, authenticated, public;

-- ============================================================
-- link_auth_user — AFTER INSERT on auth.users. When a new auth
-- identity is created (invite accepted or first Google sign-in),
-- link it to the matching allowlist row and activate it. No-op if
-- no matching row (the before_user_created hook should prevent that).
-- SECURITY DEFINER so it can write public.users regardless of the
-- inserting role (supabase_auth_admin).
-- ============================================================
create or replace function private.link_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.users
     set auth_user_id = new.id,
         status       = 'active',
         joined_at    = coalesce(joined_at, current_date)
   where lower(email) = lower(new.email)
     and deleted_at is null;
  return new;
end;
$$;
