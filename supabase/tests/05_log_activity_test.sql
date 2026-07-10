-- ============================================================
-- 05_log_activity_test.sql
-- Tests the private.log_activity() trigger on public.users.
-- Verifies INSERT / UPDATE / DELETE / restore produce the correct
-- activities rows (action, entity_label, before/after snapshots).
-- ============================================================
BEGIN;
SELECT plan(24);

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

-- ============================================================
-- INSERT → action='insert', before='{}', after=full row
-- ============================================================
INSERT INTO public.users (id, name, email, role, status)
VALUES (
  'a0000000-0005-0005-0005-000000000001'::uuid,
  'Log Test User',
  'logtest@example.com',
  'member',
  'invited'
);

SELECT extensions.is(
  (SELECT count(*)::integer FROM public.activities
    WHERE entity_type = 'users'
      AND entity_id = 'a0000000-0005-0005-0005-000000000001'::uuid
      AND action = 'insert'),
  1,
  'INSERT creates one activity row with action=insert'
);

SELECT extensions.is(
  (SELECT before FROM public.activities
    WHERE entity_type = 'users'
      AND entity_id = 'a0000000-0005-0005-0005-000000000001'::uuid
      AND action = 'insert'),
  '{}'::jsonb,
  'INSERT activity: before is empty object'
);

SELECT extensions.isnt(
  (SELECT after FROM public.activities
    WHERE entity_type = 'users'
      AND entity_id = 'a0000000-0005-0005-0005-000000000001'::uuid
      AND action = 'insert'),
  '{}'::jsonb,
  'INSERT activity: after is non-empty (full row snapshot)'
);

SELECT extensions.is(
  (SELECT entity_label FROM public.activities
    WHERE entity_type = 'users'
      AND entity_id = 'a0000000-0005-0005-0005-000000000001'::uuid
      AND action = 'insert'),
  'logtest@example.com',
  'INSERT activity: entity_label is the email (label_col=email)'
);

-- ============================================================
-- UPDATE → action='update', before=old row, after=new row
-- ============================================================
UPDATE public.users SET name = 'Log Test Renamed'
WHERE id = 'a0000000-0005-0005-0005-000000000001'::uuid;

SELECT extensions.is(
  (SELECT count(*)::integer FROM public.activities
    WHERE entity_type = 'users'
      AND entity_id = 'a0000000-0005-0005-0005-000000000001'::uuid
      AND action = 'update'),
  1,
  'UPDATE creates one activity row with action=update'
);

SELECT extensions.is(
  (SELECT before ->> 'name' FROM public.activities
    WHERE entity_type = 'users'
      AND entity_id = 'a0000000-0005-0005-0005-000000000001'::uuid
      AND action = 'update'),
  'Log Test User',
  'UPDATE activity: before.name is old value'
);

SELECT extensions.is(
  (SELECT after ->> 'name' FROM public.activities
    WHERE entity_type = 'users'
      AND entity_id = 'a0000000-0005-0005-0005-000000000001'::uuid
      AND action = 'update'),
  'Log Test Renamed',
  'UPDATE activity: after.name is new value'
);

SELECT extensions.is(
  (SELECT entity_label FROM public.activities
    WHERE entity_type = 'users'
      AND entity_id = 'a0000000-0005-0005-0005-000000000001'::uuid
      AND action = 'update'),
  'logtest@example.com',
  'UPDATE activity: entity_label is email'
);

-- ============================================================
-- Soft-delete → deleted_at goes null → non-null, action='update'
-- ============================================================
UPDATE public.users SET deleted_at = now()
WHERE id = 'a0000000-0005-0005-0005-000000000001'::uuid;

-- Now there are 2 update activities; verify the latest one has after.deleted_at non-null
SELECT extensions.is(
  (SELECT count(*)::integer FROM public.activities
    WHERE entity_type = 'users'
      AND entity_id = 'a0000000-0005-0005-0005-000000000001'::uuid
      AND action = 'update'),
  2,
  'soft-delete creates second update activity (total 2 updates)'
);

-- Check there is at least one update where after.deleted_at is non-null
SELECT extensions.ok(
  exists(
    SELECT 1 FROM public.activities
    WHERE entity_type = 'users'
      AND entity_id = 'a0000000-0005-0005-0005-000000000001'::uuid
      AND action = 'update'
      AND (after ->> 'deleted_at') IS NOT NULL
  ),
  'soft-delete update activity has non-null after.deleted_at'
);

-- ============================================================
-- Restore → deleted_at goes non-null → null → action='restore'
-- ============================================================
UPDATE public.users SET deleted_at = NULL
WHERE id = 'a0000000-0005-0005-0005-000000000001'::uuid;

SELECT extensions.is(
  (SELECT count(*)::integer FROM public.activities
    WHERE entity_type = 'users'
      AND entity_id = 'a0000000-0005-0005-0005-000000000001'::uuid
      AND action = 'restore'),
  1,
  'restore (deleted_at non-null → null) creates activity with action=restore'
);

SELECT extensions.ok(
  exists(
    SELECT 1 FROM public.activities
    WHERE entity_type = 'users'
      AND entity_id = 'a0000000-0005-0005-0005-000000000001'::uuid
      AND action = 'restore'
      AND (before ->> 'deleted_at') IS NOT NULL
  ),
  'restore activity: before.deleted_at was non-null'
);

SELECT extensions.is(
  (SELECT after ->> 'deleted_at' FROM public.activities
    WHERE entity_type = 'users'
      AND entity_id = 'a0000000-0005-0005-0005-000000000001'::uuid
      AND action = 'restore'),
  NULL,
  'restore activity: after.deleted_at is null'
);

-- ============================================================
-- Hard DELETE → action='delete', before=old row, after='{}'
-- ============================================================
DELETE FROM public.users
WHERE id = 'a0000000-0005-0005-0005-000000000001'::uuid;

SELECT extensions.is(
  (SELECT count(*)::integer FROM public.activities
    WHERE entity_type = 'users'
      AND entity_id = 'a0000000-0005-0005-0005-000000000001'::uuid
      AND action = 'delete'),
  1,
  'DELETE creates one activity row with action=delete'
);

SELECT extensions.isnt(
  (SELECT before FROM public.activities
    WHERE entity_type = 'users'
      AND entity_id = 'a0000000-0005-0005-0005-000000000001'::uuid
      AND action = 'delete'),
  '{}'::jsonb,
  'DELETE activity: before is non-empty (old row snapshot)'
);

SELECT extensions.is(
  (SELECT after FROM public.activities
    WHERE entity_type = 'users'
      AND entity_id = 'a0000000-0005-0005-0005-000000000001'::uuid
      AND action = 'delete'),
  '{}'::jsonb,
  'DELETE activity: after is empty object'
);

SELECT extensions.is(
  (SELECT entity_label FROM public.activities
    WHERE entity_type = 'users'
      AND entity_id = 'a0000000-0005-0005-0005-000000000001'::uuid
      AND action = 'delete'),
  'logtest@example.com',
  'DELETE activity: entity_label taken from before snapshot'
);

-- ============================================================
-- Total activity count (insert + 2×update + restore + delete = 5)
-- ============================================================
SELECT extensions.is(
  (SELECT count(*)::integer FROM public.activities
    WHERE entity_type = 'users'
      AND entity_id = 'a0000000-0005-0005-0005-000000000001'::uuid),
  5,
  'total 5 activity rows for the test entity'
);

-- ============================================================
-- UPDATE on a table without deleted_at (checkouts) must not crash.
-- A1 attached log_activity to checkouts/checkins, which have no
-- deleted_at column; the restore check must read it from the jsonb
-- snapshot (NULL when absent) instead of the record field directly.
-- ============================================================
INSERT INTO public.groups (id, name)
VALUES ('a0000000-0005-0005-0005-000000000002'::uuid, 'Log Test Group');

INSERT INTO public.manufacturers (id, name)
VALUES ('a0000000-0005-0005-0005-000000000003'::uuid, 'Log Test Manufacturer');

INSERT INTO public.devices (id, code, name, group_id, manufacturer_id)
VALUES (
  'a0000000-0005-0005-0005-000000000004'::uuid, 'LOGTEST-001', 'Log Test Device',
  'a0000000-0005-0005-0005-000000000002'::uuid, 'a0000000-0005-0005-0005-000000000003'::uuid
);

INSERT INTO public.checkouts (id, device_id, borrower_name, quantity)
VALUES (
  'a0000000-0005-0005-0005-000000000005'::uuid,
  'a0000000-0005-0005-0005-000000000004'::uuid, 'Log Test Borrower', 1
);

SELECT extensions.lives_ok(
  $$ UPDATE public.checkouts SET notes = 'x'
     WHERE id = 'a0000000-0005-0005-0005-000000000005'::uuid $$,
  'UPDATE on checkouts (no deleted_at column) does not raise'
);

SELECT extensions.is(
  (SELECT count(*)::integer FROM public.activities
    WHERE entity_type = 'checkouts'
      AND entity_id = 'a0000000-0005-0005-0005-000000000005'::uuid
      AND action = 'update'),
  1,
  'checkouts UPDATE writes exactly one activity row with action=update'
);

-- ============================================================
-- Restore detection still works for a deleted_at table (devices).
-- ============================================================
UPDATE public.devices SET deleted_at = now()
WHERE id = 'a0000000-0005-0005-0005-000000000004'::uuid;

UPDATE public.devices SET deleted_at = NULL
WHERE id = 'a0000000-0005-0005-0005-000000000004'::uuid;

SELECT extensions.is(
  (SELECT count(*)::integer FROM public.activities
    WHERE entity_type = 'devices'
      AND entity_id = 'a0000000-0005-0005-0005-000000000004'::uuid
      AND action = 'restore'),
  1,
  'devices restore (deleted_at non-null -> null) still logs action=restore'
);

-- ============================================================
-- SECURITY DEFINER attribute checks
-- ============================================================
SELECT extensions.is(
  (SELECT prosecdef FROM pg_proc p
     JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'private'
      AND p.proname = 'log_activity'),
  true,
  'private.log_activity is SECURITY DEFINER'
);

SELECT extensions.is(
  (SELECT prosecdef FROM pg_proc p
     JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'private'
      AND p.proname = 'link_auth_user'),
  true,
  'private.link_auth_user is SECURITY DEFINER'
);

-- ============================================================
-- actor_id is null when no authenticated session
-- (postgres superuser has no JWT, so app_user_id() returns null)
-- ============================================================
SELECT extensions.is(
  (SELECT actor_id FROM public.activities
    WHERE entity_type = 'users'
      AND entity_id = 'a0000000-0005-0005-0005-000000000001'::uuid
      AND action = 'insert'),
  NULL::uuid,
  'actor_id is null when no JWT session (superuser inserts)'
);

SELECT * FROM finish();
ROLLBACK;
