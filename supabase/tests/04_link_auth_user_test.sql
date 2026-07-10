-- ============================================================
-- 04_link_auth_user_test.sql
-- Tests the on_auth_user_created trigger (private.link_auth_user).
-- Inserts into auth.users and asserts the matching public.users row
-- is linked, activated, and joined_at set.
-- Also tests the no-op case (no matching allowlist row).
-- ============================================================
BEGIN;
SELECT plan(8);

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

-- ============================================================
-- Seed an invited public.users row
-- ============================================================
INSERT INTO public.users (id, name, email, role, status)
VALUES (
  'aaaaaaaa-0002-0002-0002-000000000001'::uuid,
  'Alice Invited',
  'alice@example.com',
  'member',
  'invited'
);

-- Pre-condition: not yet linked
SELECT is(
  (SELECT auth_user_id FROM public.users WHERE email = 'alice@example.com'),
  NULL::uuid,
  'pre-condition: auth_user_id is null before auth insert'
);

SELECT is(
  (SELECT status FROM public.users WHERE email = 'alice@example.com')::text,
  'invited',
  'pre-condition: status is invited before auth insert'
);

-- ============================================================
-- Insert matching auth.users row — trigger fires
-- ============================================================
INSERT INTO auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
  'bbbbbbbb-0002-0002-0002-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'alice@example.com',
  '',
  now(),
  now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb
);

-- ============================================================
-- Post-condition: public.users row updated
-- ============================================================
SELECT is(
  (SELECT auth_user_id FROM public.users WHERE email = 'alice@example.com'),
  'bbbbbbbb-0002-0002-0002-000000000001'::uuid,
  'auth_user_id set after auth insert'
);

SELECT is(
  (SELECT status FROM public.users WHERE email = 'alice@example.com')::text,
  'active',
  'status flipped to active after auth insert'
);

SELECT isnt(
  (SELECT joined_at FROM public.users WHERE email = 'alice@example.com'),
  NULL::date,
  'joined_at populated after auth insert'
);

-- ============================================================
-- No-op case: auth insert with no matching allowlist row
-- ============================================================
-- Count activities before
DO $$
DECLARE v_count integer;
BEGIN
  SELECT count(*) INTO v_count FROM public.users WHERE email = 'nobody@example.com';
  IF v_count != 0 THEN RAISE EXCEPTION 'unexpected pre-existing row'; END IF;
END $$;

INSERT INTO auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
  'cccccccc-0002-0002-0002-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'nobody@example.com',
  '',
  now(),
  now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb
);

-- public.users unchanged for nobody
SELECT is(
  (SELECT count(*)::integer FROM public.users WHERE email = 'nobody@example.com'),
  0,
  'no-op: no public.users row created for unrecognised auth insert'
);

-- alice row not touched by nobody insert
SELECT is(
  (SELECT auth_user_id FROM public.users WHERE email = 'alice@example.com'),
  'bbbbbbbb-0002-0002-0002-000000000001'::uuid,
  'alice row untouched by unrelated auth insert'
);

-- ============================================================
-- joined_at is preserved if already set (coalesce behaviour)
-- ============================================================
-- Seed another invited user with joined_at pre-set
INSERT INTO public.users (id, name, email, role, status, joined_at)
VALUES (
  'aaaaaaaa-0002-0002-0002-000000000002'::uuid,
  'Bob Preset',
  'bob@example.com',
  'member',
  'invited',
  '2025-01-15'::date
);

INSERT INTO auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
  'bbbbbbbb-0002-0002-0002-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'bob@example.com',
  '',
  now(),
  now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb
);

SELECT is(
  (SELECT joined_at FROM public.users WHERE email = 'bob@example.com'),
  '2025-01-15'::date,
  'joined_at preserved when pre-set (coalesce does not overwrite)'
);

SELECT * FROM finish();
ROLLBACK;
