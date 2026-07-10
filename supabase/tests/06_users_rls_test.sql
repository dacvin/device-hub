-- ============================================================
-- 06_users_rls_test.sql
-- Tests RLS policies on public.users.
-- Uses SET LOCAL ROLE + request.jwt.claims to simulate
-- authenticated (admin / member) and anon sessions.
--
-- NOTE: pgTAP temp tables storing test state DO NOT survive
-- ROLLBACK TO SAVEPOINT — so we avoid savepoints here.
-- All changes accumulate in the outer transaction and are
-- rolled back at the end by ROLLBACK.
--
-- seed.sql inserts 1 user (vinh.huynh@sioux.asia); tests that
-- count rows filter by test-specific UUIDs.
-- ============================================================
BEGIN;
SELECT plan(21);

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

-- ============================================================
-- Seed data (as postgres superuser, bypasses RLS)
-- ============================================================
INSERT INTO auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) VALUES (
  'a0a0a0a0-0006-4006-a006-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated', 'authenticated',
  'admin6@example.com', '', now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb
);

INSERT INTO public.users (id, auth_user_id, name, email, role, status)
VALUES (
  'b0b0b0b0-0006-4006-b006-000000000001'::uuid,
  'a0a0a0a0-0006-4006-a006-000000000001'::uuid,
  'Admin User', 'admin6@example.com', 'admin', 'active'
);

INSERT INTO auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) VALUES (
  'c0c0c0c0-0006-4006-c006-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated', 'authenticated',
  'member6@example.com', '', now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb
);

INSERT INTO public.users (id, auth_user_id, name, email, role, status)
VALUES (
  'd0d0d0d0-0006-4006-d006-000000000001'::uuid,
  'c0c0c0c0-0006-4006-c006-000000000001'::uuid,
  'Member User', 'member6@example.com', 'member', 'active'
);

INSERT INTO public.users (id, name, email, role, status)
VALUES (
  'e0e0e0e0-0006-4006-e006-000000000001'::uuid,
  'Invited User', 'invited6@example.com', 'member', 'invited'
);

-- ============================================================
-- 1. authenticated SELECT — all 3 test rows visible
-- ============================================================
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"c0c0c0c0-0006-4006-c006-000000000001","role":"authenticated"}';

SELECT extensions.is(
  (SELECT count(*)::integer FROM public.users
   WHERE id IN (
     'b0b0b0b0-0006-4006-b006-000000000001'::uuid,
     'd0d0d0d0-0006-4006-d006-000000000001'::uuid,
     'e0e0e0e0-0006-4006-e006-000000000001'::uuid
   )),
  3,
  'authenticated member can SELECT test users (all 3 visible)'
);

RESET ROLE;

-- ============================================================
-- 2. anon SELECT — permission denied (no table-level grant)
-- ============================================================
RESET "request.jwt.claims";
SET LOCAL ROLE anon;

SELECT extensions.throws_ok(
  $$SELECT count(*) FROM public.users$$,
  NULL,
  'anon SELECT on public.users is denied (no table grant)'
);

RESET ROLE;

-- ============================================================
-- 3. authenticated INSERT as admin — succeeds
-- (this row stays in tx; later tests may see it, but we only
--  check for specific IDs/emails)
-- ============================================================
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"a0a0a0a0-0006-4006-a006-000000000001","role":"authenticated"}';

INSERT INTO public.users (id, name, email, role, status)
VALUES (
  'f0f0f0f0-0006-4006-f006-000000000001'::uuid,
  'New Invite', 'newinvite6@example.com', 'member', 'invited'
);

SELECT extensions.is(
  (SELECT count(*)::integer FROM public.users WHERE email = 'newinvite6@example.com'),
  1,
  'admin can INSERT a new user'
);

RESET ROLE;

-- ============================================================
-- 4. authenticated INSERT as member — blocked by RLS
-- ============================================================
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"c0c0c0c0-0006-4006-c006-000000000001","role":"authenticated"}';

SELECT extensions.throws_ok(
  $$INSERT INTO public.users (id, name, email, role, status)
    VALUES (
      'a1a1a1a1-0006-4006-a106-000000000001'::uuid,
      'Sneaky', 'sneaky6@example.com', 'member', 'invited'
    )$$,
  'new row violates row-level security policy for table "users"',
  'member cannot INSERT a new user (RLS blocks)'
);

RESET ROLE;

-- ============================================================
-- 5. member self-update of allowed field (name) — succeeds
-- ============================================================
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"c0c0c0c0-0006-4006-c006-000000000001","role":"authenticated"}';

UPDATE public.users SET name = 'Member Renamed'
WHERE id = 'd0d0d0d0-0006-4006-d006-000000000001'::uuid;

SELECT extensions.is(
  (SELECT name FROM public.users WHERE id = 'd0d0d0d0-0006-4006-d006-000000000001'::uuid),
  'Member Renamed',
  'member can UPDATE own name (allowed field)'
);

RESET ROLE;

-- ============================================================
-- 6. member self-update changing role — blocked (WITH CHECK)
-- ============================================================
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"c0c0c0c0-0006-4006-c006-000000000001","role":"authenticated"}';

SELECT extensions.throws_ok(
  $$UPDATE public.users SET role = 'admin'
    WHERE id = 'd0d0d0d0-0006-4006-d006-000000000001'::uuid$$,
  'new row violates row-level security policy for table "users"',
  'member cannot change own role to admin'
);

RESET ROLE;

-- ============================================================
-- 7. member self-update changing status — blocked
-- ============================================================
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"c0c0c0c0-0006-4006-c006-000000000001","role":"authenticated"}';

SELECT extensions.throws_ok(
  $$UPDATE public.users SET status = 'deactivated'
    WHERE id = 'd0d0d0d0-0006-4006-d006-000000000001'::uuid$$,
  'new row violates row-level security policy for table "users"',
  'member cannot change own status'
);

RESET ROLE;

-- ============================================================
-- 8. member cannot update another user's row (USING fails, 0 rows)
-- ============================================================
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"c0c0c0c0-0006-4006-c006-000000000001","role":"authenticated"}';

UPDATE public.users SET name = 'Hacked'
WHERE id = 'b0b0b0b0-0006-4006-b006-000000000001'::uuid;

SELECT extensions.is(
  (SELECT name FROM public.users WHERE id = 'b0b0b0b0-0006-4006-b006-000000000001'::uuid),
  'Admin User',
  'member cannot UPDATE another user''s row (0 rows affected)'
);

RESET ROLE;

-- ============================================================
-- 9. admin can UPDATE any row (other user's name)
-- ============================================================
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"a0a0a0a0-0006-4006-a006-000000000001","role":"authenticated"}';

UPDATE public.users SET name = 'Admin Changed This'
WHERE id = 'd0d0d0d0-0006-4006-d006-000000000001'::uuid;

SELECT extensions.is(
  (SELECT name FROM public.users WHERE id = 'd0d0d0d0-0006-4006-d006-000000000001'::uuid),
  'Admin Changed This',
  'admin can UPDATE any user row'
);

RESET ROLE;

-- ============================================================
-- 10. admin can DELETE a row
-- (superuser inserts extra row; admin deletes it)
-- ============================================================
INSERT INTO public.users (id, name, email, role, status)
VALUES (
  'a2a2a2a2-0006-4006-a206-000000000001'::uuid,
  'To Delete', 'todelete6@example.com', 'member', 'invited'
);

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"a0a0a0a0-0006-4006-a006-000000000001","role":"authenticated"}';

DELETE FROM public.users WHERE id = 'a2a2a2a2-0006-4006-a206-000000000001'::uuid;

SELECT extensions.is(
  (SELECT count(*)::integer FROM public.users WHERE id = 'a2a2a2a2-0006-4006-a206-000000000001'::uuid),
  0,
  'admin can DELETE a user row'
);

RESET ROLE;

-- ============================================================
-- 11. member cannot DELETE a row (USING fails, 0 rows affected)
-- ============================================================
INSERT INTO public.users (id, name, email, role, status)
VALUES (
  'a3a3a3a3-0006-4006-a306-000000000001'::uuid,
  'No Delete', 'nodelete6@example.com', 'member', 'invited'
);

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"c0c0c0c0-0006-4006-c006-000000000001","role":"authenticated"}';

DELETE FROM public.users WHERE id = 'a3a3a3a3-0006-4006-a306-000000000001'::uuid;

SELECT extensions.is(
  (SELECT count(*)::integer FROM public.users WHERE id = 'a3a3a3a3-0006-4006-a306-000000000001'::uuid),
  1,
  'member cannot DELETE any user row (0 rows affected)'
);

RESET ROLE;

-- ============================================================
-- 12. anon cannot INSERT (permission denied, no table grant)
-- ============================================================
RESET "request.jwt.claims";
SET LOCAL ROLE anon;

SELECT extensions.throws_ok(
  $$INSERT INTO public.users (id, name, email, role, status)
    VALUES (
      'a4a4a4a4-0006-4006-a406-000000000001'::uuid,
      'Anon Insert', 'anoninsert6@example.com', 'member', 'invited'
    )$$,
  NULL,
  'anon cannot INSERT into public.users'
);

RESET ROLE;

-- ============================================================
-- 13. admin cannot change another user's role (immutable for all)
-- ============================================================
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"a0a0a0a0-0006-4006-a006-000000000001","role":"authenticated"}';

SELECT extensions.throws_ok(
  $$UPDATE public.users SET role = 'admin'
    WHERE id = 'd0d0d0d0-0006-4006-d006-000000000001'::uuid$$,
  'new row violates row-level security policy for table "users"',
  'admin cannot promote another user to admin role'
);

RESET ROLE;

-- ============================================================
-- 14. member self-update changing deleted_at — blocked
-- ============================================================
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"c0c0c0c0-0006-4006-c006-000000000001","role":"authenticated"}';

SELECT extensions.throws_ok(
  $$UPDATE public.users SET deleted_at = now()
    WHERE id = 'd0d0d0d0-0006-4006-d006-000000000001'::uuid$$,
  'new row violates row-level security policy for table "users"',
  'member cannot self-soft-delete (deleted_at change blocked)'
);

RESET ROLE;

-- ============================================================
-- 15. member self-update changing auth_user_id — blocked
-- ============================================================
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"c0c0c0c0-0006-4006-c006-000000000001","role":"authenticated"}';

SELECT extensions.throws_ok(
  $$UPDATE public.users SET auth_user_id = 'a0a0a0a0-0006-4006-a006-000000000001'::uuid
    WHERE id = 'd0d0d0d0-0006-4006-d006-000000000001'::uuid$$,
  'new row violates row-level security policy for table "users"',
  'member cannot change own auth_user_id'
);

RESET ROLE;

-- ============================================================
-- 16. member self-update changing invited_by — blocked
-- ============================================================
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"c0c0c0c0-0006-4006-c006-000000000001","role":"authenticated"}';

SELECT extensions.throws_ok(
  $$UPDATE public.users SET invited_by = 'b0b0b0b0-0006-4006-b006-000000000001'::uuid
    WHERE id = 'd0d0d0d0-0006-4006-d006-000000000001'::uuid$$,
  'new row violates row-level security policy for table "users"',
  'member cannot change own invited_by'
);

RESET ROLE;

-- ============================================================
-- 17. member cannot change own email (immutable — auth anchor)
-- ============================================================
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"c0c0c0c0-0006-4006-c006-000000000001","role":"authenticated"}';
SELECT extensions.throws_ok(
  $$UPDATE public.users SET email = 'changed6@example.com'
    WHERE id = 'd0d0d0d0-0006-4006-d006-000000000001'::uuid$$,
  'new row violates row-level security policy for table "users"',
  'member cannot change own email'
);
RESET ROLE;

-- ============================================================
-- 18. member cannot change own joined_at
-- ============================================================
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"c0c0c0c0-0006-4006-c006-000000000001","role":"authenticated"}';
SELECT extensions.throws_ok(
  $$UPDATE public.users SET joined_at = '2000-01-01'
    WHERE id = 'd0d0d0d0-0006-4006-d006-000000000001'::uuid$$,
  'new row violates row-level security policy for table "users"',
  'member cannot change own joined_at'
);
RESET ROLE;

-- ============================================================
-- 19. admin cannot change any user's role (immutable for all)
-- ============================================================
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"a0a0a0a0-0006-4006-a006-000000000001","role":"authenticated"}';
SELECT extensions.throws_ok(
  $$UPDATE public.users SET role = 'admin'
    WHERE id = 'd0d0d0d0-0006-4006-d006-000000000001'::uuid$$,
  'new row violates row-level security policy for table "users"',
  'admin cannot change a user role'
);
RESET ROLE;

-- ============================================================
-- 20. admin cannot change any user's email
-- ============================================================
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"a0a0a0a0-0006-4006-a006-000000000001","role":"authenticated"}';
SELECT extensions.throws_ok(
  $$UPDATE public.users SET email = 'newemail6@example.com'
    WHERE id = 'd0d0d0d0-0006-4006-d006-000000000001'::uuid$$,
  'new row violates row-level security policy for table "users"',
  'admin cannot change a user email'
);
RESET ROLE;

-- ============================================================
-- 21. admin CAN change another user's status (activate/deactivate)
-- ============================================================
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"a0a0a0a0-0006-4006-a006-000000000001","role":"authenticated"}';
UPDATE public.users SET status = 'deactivated'
WHERE id = 'd0d0d0d0-0006-4006-d006-000000000001'::uuid;
SELECT extensions.is(
  (SELECT status::text FROM public.users WHERE id = 'd0d0d0d0-0006-4006-d006-000000000001'::uuid),
  'deactivated',
  'admin can change another user status'
);
RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
