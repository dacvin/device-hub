-- ============================================================
-- 07_activities_rls_test.sql
-- Tests RLS policies on public.activities.
-- authenticated can SELECT; direct INSERT as authenticated is denied
-- (no INSERT table grant → "permission denied");
-- UPDATE/DELETE also denied because authenticated has no grant for these.
-- anon has no table-level grant → raises "permission denied" on SELECT.
--
-- NOTE: Avoids ROLLBACK TO SAVEPOINT to preserve pgTAP state.
-- All changes accumulate in the outer transaction and are rolled back at end.
-- ============================================================
BEGIN;
SELECT plan(9);

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

-- ============================================================
-- Seed: insert a user which fires log_activity → creates activities rows.
-- ============================================================
INSERT INTO public.users (id, name, email, role, status)
VALUES (
  'b0b0b0b0-0007-4007-b007-000000000001'::uuid,
  'Activity Test 7', 'acttest7@example.com', 'member', 'active'
);

INSERT INTO auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) VALUES (
  'a0a0a0a0-0007-4007-a007-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated', 'authenticated',
  'acttest7@example.com', '', now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb
);

-- Pre-condition: our test entity has at least 1 activity (from log_activity trigger)
SELECT extensions.ok(
  (SELECT count(*)::integer FROM public.activities
    WHERE entity_id = 'b0b0b0b0-0007-4007-b007-000000000001'::uuid) > 0,
  'pre-condition: activities has rows for test user (trigger fired)'
);

-- ============================================================
-- 1. authenticated can SELECT activities
-- ============================================================
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"a0a0a0a0-0007-4007-a007-000000000001","role":"authenticated"}';

SELECT extensions.ok(
  (SELECT count(*)::integer FROM public.activities
    WHERE entity_id = 'b0b0b0b0-0007-4007-b007-000000000001'::uuid) > 0,
  'authenticated can SELECT from public.activities'
);

RESET ROLE;

-- ============================================================
-- 2. anon SELECT is denied (no table-level grant for anon)
-- ============================================================
RESET "request.jwt.claims";
SET LOCAL ROLE anon;

SELECT extensions.throws_ok(
  $$SELECT count(*) FROM public.activities$$,
  NULL,
  'anon SELECT on public.activities is denied (no table grant)'
);

RESET ROLE;

-- ============================================================
-- 3. authenticated direct INSERT into activities is denied
-- (authenticated has no INSERT grant → "permission denied")
-- ============================================================
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"a0a0a0a0-0007-4007-a007-000000000001","role":"authenticated"}';

SELECT extensions.throws_ok(
  $$INSERT INTO public.activities (action, entity_type, entity_id, before, after)
    VALUES ('insert', 'users', gen_random_uuid(), '{}', '{}')$$,
  NULL,
  'authenticated cannot directly INSERT into public.activities (permission denied)'
);

RESET ROLE;

-- ============================================================
-- 4. authenticated UPDATE of activities is denied
-- (authenticated has no UPDATE grant → "permission denied")
-- ============================================================
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"a0a0a0a0-0007-4007-a007-000000000001","role":"authenticated"}';

SELECT extensions.throws_ok(
  $$UPDATE public.activities SET entity_label = 'tampered' WHERE entity_type = 'users'$$,
  NULL,
  'authenticated cannot UPDATE public.activities (permission denied)'
);

RESET ROLE;

-- ============================================================
-- 5. authenticated DELETE of activities is denied
-- (authenticated has no DELETE grant → "permission denied")
-- ============================================================
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"a0a0a0a0-0007-4007-a007-000000000001","role":"authenticated"}';

SELECT extensions.throws_ok(
  $$DELETE FROM public.activities WHERE entity_type = 'users'$$,
  NULL,
  'authenticated cannot DELETE from public.activities (permission denied)'
);

RESET ROLE;

-- ============================================================
-- 6. trigger-written rows are visible to authenticated
-- (SECURITY DEFINER trigger inserts bypassing RLS)
-- ============================================================
INSERT INTO public.users (id, name, email, role, status)
VALUES (
  'c0c0c0c0-0007-4007-c007-000000000001'::uuid,
  'Trigger Test 7', 'trigtest7@example.com', 'member', 'invited'
);

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"a0a0a0a0-0007-4007-a007-000000000001","role":"authenticated"}';

SELECT extensions.ok(
  (SELECT count(*)::integer FROM public.activities
    WHERE entity_id = 'c0c0c0c0-0007-4007-c007-000000000001'::uuid) > 0,
  'trigger-inserted activity rows are visible to authenticated'
);

RESET ROLE;

-- ============================================================
-- 7. activities table is immutable: no updated_at column
-- ============================================================
SELECT extensions.hasnt_column(
  'public', 'activities', 'updated_at',
  'activities has no updated_at (immutable table design)'
);

-- ============================================================
-- 8. activities table is immutable: no deleted_at column
-- ============================================================
SELECT extensions.hasnt_column(
  'public', 'activities', 'deleted_at',
  'activities has no deleted_at (immutable table design)'
);

SELECT * FROM finish();
ROLLBACK;
