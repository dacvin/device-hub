-- ============================================================
-- 02_grants_test.sql
-- Verifies table-level privilege grants are correct.
-- Uses pg_catalog.has_table_privilege(rolname, table, priv) —
-- a native PostgreSQL system function, 3-argument form.
-- ============================================================
BEGIN;
SELECT plan(17);

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

-- ============================================================
-- authenticated role on public.users
-- ============================================================
SELECT extensions.ok(
  pg_catalog.has_table_privilege('authenticated', 'public.users', 'SELECT'),
  'authenticated has SELECT on public.users'
);
SELECT extensions.ok(
  pg_catalog.has_table_privilege('authenticated', 'public.users', 'INSERT'),
  'authenticated has INSERT on public.users'
);
SELECT extensions.ok(
  pg_catalog.has_table_privilege('authenticated', 'public.users', 'UPDATE'),
  'authenticated has UPDATE on public.users'
);
SELECT extensions.ok(
  pg_catalog.has_table_privilege('authenticated', 'public.users', 'DELETE'),
  'authenticated has DELETE on public.users'
);

-- ============================================================
-- authenticated role on public.activities (SELECT only)
-- ============================================================
SELECT extensions.ok(
  pg_catalog.has_table_privilege('authenticated', 'public.activities', 'SELECT'),
  'authenticated has SELECT on public.activities'
);

-- authenticated must NOT have INSERT/UPDATE/DELETE on activities
-- (writes happen via SECURITY DEFINER trigger only)
SELECT extensions.ok(
  NOT pg_catalog.has_table_privilege('authenticated', 'public.activities', 'INSERT'),
  'authenticated lacks INSERT on public.activities'
);
SELECT extensions.ok(
  NOT pg_catalog.has_table_privilege('authenticated', 'public.activities', 'UPDATE'),
  'authenticated lacks UPDATE on public.activities'
);
SELECT extensions.ok(
  NOT pg_catalog.has_table_privilege('authenticated', 'public.activities', 'DELETE'),
  'authenticated lacks DELETE on public.activities'
);

-- ============================================================
-- service_role on both tables
-- ============================================================
SELECT extensions.ok(
  pg_catalog.has_table_privilege('service_role', 'public.users', 'SELECT'),
  'service_role has SELECT on public.users'
);
SELECT extensions.ok(
  pg_catalog.has_table_privilege('service_role', 'public.users', 'INSERT'),
  'service_role has INSERT on public.users'
);
SELECT extensions.ok(
  pg_catalog.has_table_privilege('service_role', 'public.users', 'UPDATE'),
  'service_role has UPDATE on public.users'
);
SELECT extensions.ok(
  pg_catalog.has_table_privilege('service_role', 'public.users', 'DELETE'),
  'service_role has DELETE on public.users'
);
SELECT extensions.ok(
  pg_catalog.has_table_privilege('service_role', 'public.activities', 'SELECT'),
  'service_role has SELECT on public.activities'
);
SELECT extensions.ok(
  pg_catalog.has_table_privilege('service_role', 'public.activities', 'INSERT'),
  'service_role has INSERT on public.activities'
);

-- ============================================================
-- anon must NOT have SELECT/INSERT/UPDATE/DELETE on either table
-- ============================================================
SELECT extensions.ok(
  NOT pg_catalog.has_table_privilege('anon', 'public.users', 'SELECT'),
  'anon lacks SELECT on public.users'
);
SELECT extensions.ok(
  NOT pg_catalog.has_table_privilege('anon', 'public.activities', 'SELECT'),
  'anon lacks SELECT on public.activities'
);
SELECT extensions.ok(
  NOT pg_catalog.has_table_privilege('anon', 'public.users', 'INSERT'),
  'anon lacks INSERT on public.users'
);

SELECT * FROM finish();
ROLLBACK;
