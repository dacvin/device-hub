-- Table-level privileges for PostgREST roles (RLS still filters rows).
grant select, insert, update, delete on public.users to authenticated;
grant all on public.users to service_role;
-- Allow the auth hook (runs as supabase_auth_admin) to query the allowlist.
grant select on public.users to supabase_auth_admin;

-- Read for authenticated (RLS filters); full access for service_role. Inserts
-- happen via the SECURITY DEFINER trigger, so authenticated needs only SELECT.
grant select on public.activities to authenticated;
grant all on public.activities to service_role;
