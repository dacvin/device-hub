-- ============================================================
-- DeviceHub — core
-- Extensions + private schema for SECURITY DEFINER helpers +
-- shared trigger functions + storage buckets.
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- private schema — home for the log_activity SECURITY DEFINER
-- trigger function. PostgREST exposes only the schemas in
-- db.api.schemas (default: public, graphql_public), so anything
-- in `private` is unreachable as an RPC.
--
-- Triggers invoke functions through the trigger machinery, not the
-- caller's role, so a missing USAGE grant on `private` does not
-- block log_activity from firing.
--
-- The other helpers (is_admin / app_user_id) live in `public` as
-- SECURITY INVOKER — they don't bypass any RLS, so they don't need
-- DEFINER privileges and don't need to hide.
-- ============================================================

create schema if not exists private;


-- ============================================================
-- set_updated_at — BEFORE UPDATE trigger on every table with
-- updated_at. SECURITY INVOKER (the default); doesn't need
-- elevated rights.
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;


-- ============================================================
-- Storage buckets
-- ============================================================

insert into storage.buckets (id, name, public) values
  ('device-photos',    'device-photos',    false),
  ('device-documents', 'device-documents', false)
on conflict (id) do nothing;

create policy "authenticated read device files"
  on storage.objects for select to authenticated
  using (bucket_id in ('device-photos', 'device-documents'));

create policy "authenticated write device files"
  on storage.objects for insert to authenticated
  with check (bucket_id in ('device-photos', 'device-documents'));

create policy "authenticated update device files"
  on storage.objects for update to authenticated
  using (bucket_id in ('device-photos', 'device-documents'))
  with check (bucket_id in ('device-photos', 'device-documents'));

create policy "authenticated delete device files"
  on storage.objects for delete to authenticated
  using (bucket_id in ('device-photos', 'device-documents'));
