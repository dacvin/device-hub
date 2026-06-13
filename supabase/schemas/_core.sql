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
-- log_activity — AFTER INSERT/UPDATE/DELETE trigger that writes
-- one row into public.activities per mutation. before/after carry
-- full row snapshots so any field-level diff is reconstructable.
--
-- A deleted_at going non-null → null is recorded as action='restore'.
--
-- SECURITY DEFINER because activities has no INSERT policy — only
-- this trigger can insert. Lives in `private` (non-exposed) and has
-- EXECUTE revoked from PUBLIC; only the table triggers can invoke
-- it via their explicit reference.
--
-- public.app_user_id() is referenced lazily (plpgsql defers
-- identifier resolution to first call); defined in users-functions.sql.
-- ============================================================

create or replace function private.log_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- v_action is plain text (not public.activity_action) so this file
  -- can be created before activities.sql defines the enum. plpgsql
  -- checks DECLARE'd types eagerly; the cast inside the INSERT below
  -- is resolved at first call, by which time the enum exists.
  v_action     text;
  v_entity_id  uuid;
  v_label_col  text;
  v_label      text;
  v_before     jsonb;
  v_after      jsonb;
begin
  v_action := lower(tg_op);

  if tg_op = 'INSERT' then
    v_before    := '{}'::jsonb;
    v_after     := to_jsonb(new);
    v_entity_id := (new).id;
  elsif tg_op = 'UPDATE' then
    v_before    := to_jsonb(old);
    v_after     := to_jsonb(new);
    v_entity_id := (new).id;
    if (old.deleted_at is not null) and (new.deleted_at is null) then
      v_action := 'restore';
    end if;
  else  -- DELETE (only fires for hard deletes; soft-delete is an UPDATE)
    v_before    := to_jsonb(old);
    v_after     := '{}'::jsonb;
    v_entity_id := (old).id;
  end if;

  v_label_col := coalesce(tg_argv[0], 'name');
  v_label     := coalesce(v_after ->> v_label_col, v_before ->> v_label_col);

  insert into public.activities (
    actor_id, action, entity_type, entity_id, entity_label, before, after
  ) values (
    public.app_user_id(),
    v_action::public.activity_action,
    tg_table_name,
    v_entity_id,
    v_label,
    v_before,
    v_after
  );

  return null;
end;
$$;

-- private.log_activity() is invoked from trigger context only (the
-- trigger machinery resolves the function as the table owner). No
-- direct RPC exposure because `private` is not in db.api.schemas.


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
