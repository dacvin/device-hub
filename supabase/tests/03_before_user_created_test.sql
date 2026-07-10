-- ============================================================
-- 03_before_user_created_test.sql
-- Tests private.before_user_created() auth hook logic.
-- ============================================================
BEGIN;
SELECT plan(7);

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

-- Seed an invited user (bypass triggers with postgres role)
INSERT INTO public.users (id, name, email, role, status)
VALUES (
  'aaaaaaaa-0001-0001-0001-000000000001'::uuid,
  'Invited User',
  'invited@example.com',
  'member',
  'invited'
);

-- ============================================================
-- 1. SECURITY DEFINER attribute check
-- ============================================================
SELECT is(
  (SELECT prosecdef FROM pg_proc p
     JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'private'
      AND p.proname = 'before_user_created'),
  true,
  'private.before_user_created is SECURITY DEFINER'
);

-- ============================================================
-- 2. Invited email → returns {} (allow)
-- ============================================================
SELECT is(
  private.before_user_created('{"user":{"email":"invited@example.com"}}'::jsonb),
  '{}'::jsonb,
  'invited email returns {} (allow)'
);

-- Case-insensitive match
SELECT is(
  private.before_user_created('{"user":{"email":"INVITED@EXAMPLE.COM"}}'::jsonb),
  '{}'::jsonb,
  'invited email (uppercase) returns {} (case-insensitive)'
);

-- ============================================================
-- 3. Uninvited email → returns error with http_code 403
-- ============================================================
SELECT is(
  private.before_user_created('{"user":{"email":"stranger@example.com"}}'::jsonb) -> 'error' ->> 'http_code',
  '403',
  'uninvited email returns http_code 403'
);

SELECT is(
  (private.before_user_created('{"user":{"email":"stranger@example.com"}}'::jsonb) -> 'error' -> 'message') IS NOT NULL,
  true,
  'uninvited email error includes message'
);

-- ============================================================
-- 4. Deleted (soft-deleted) invited user is treated as uninvited
-- ============================================================
UPDATE public.users SET deleted_at = now()
WHERE email = 'invited@example.com';

SELECT is(
  private.before_user_created('{"user":{"email":"invited@example.com"}}'::jsonb) -> 'error' ->> 'http_code',
  '403',
  'soft-deleted invited email is treated as uninvited'
);

-- ============================================================
-- 5. Null email → returns error (no allowlist match)
-- ============================================================
SELECT is(
  (private.before_user_created('{"user":{"email":null}}'::jsonb) -> 'error' ->> 'http_code'),
  '403',
  'null email returns 403'
);

SELECT * FROM finish();
ROLLBACK;
