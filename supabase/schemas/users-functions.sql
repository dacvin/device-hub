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
