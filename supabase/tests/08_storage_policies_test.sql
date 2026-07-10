-- ============================================================
-- 08_storage_policies_test.sql
-- Tests the device-file storage.objects RLS policies + buckets
-- defined in schemas/_core.sql:
--   - device-photos / device-documents / checkout-photos buckets exist and are private
--   - 4 policies (read/write/update/delete) exist on storage.objects
--   - authenticated has full CRUD on objects in those buckets
--   - anon is denied
--   - the policies are bucket-scoped (a non-device bucket is denied)
--
-- Uses SET LOCAL ROLE to simulate authenticated / anon sessions.
-- The device-file policies key off bucket_id only (not auth.uid()),
-- so no jwt claims are needed. All changes roll back at the end.
--
-- NOTE: DELETE is only checked at the policy-existence level. The local
-- storage schema has a storage.protect_delete() trigger that blocks direct
-- SQL DELETE on storage.objects (removals must go through the Storage API,
-- which is what the app's removeDeviceFiles uses), so a behavioural direct
-- DELETE cannot be exercised here.
-- ============================================================
BEGIN;
SELECT plan(16);

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

-- ============================================================
-- Buckets exist and are private
-- ============================================================
SELECT extensions.is(
  (SELECT public FROM storage.buckets WHERE id = 'device-photos'),
  false,
  'device-photos bucket exists and is private'
);
SELECT extensions.is(
  (SELECT public FROM storage.buckets WHERE id = 'device-documents'),
  false,
  'device-documents bucket exists and is private'
);
SELECT extensions.is(
  (SELECT public FROM storage.buckets WHERE id = 'checkout-photos'),
  false,
  'checkout-photos bucket exists and is private'
);

-- ============================================================
-- The 4 device-file policies exist on storage.objects
-- ============================================================
SELECT extensions.ok(
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'authenticated read device files'
  ),
  'SELECT policy "authenticated read device files" exists'
);
SELECT extensions.ok(
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'authenticated write device files'
  ),
  'INSERT policy "authenticated write device files" exists'
);
SELECT extensions.ok(
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'authenticated update device files'
  ),
  'UPDATE policy "authenticated update device files" exists'
);
SELECT extensions.ok(
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'authenticated delete device files'
  ),
  'DELETE policy "authenticated delete device files" exists'
);

-- ============================================================
-- authenticated INSERT into device-photos — succeeds
-- ============================================================
SET LOCAL ROLE authenticated;

INSERT INTO storage.objects (bucket_id, name)
VALUES ('device-photos', 'rlstest/photo-1.png');

SELECT extensions.is(
  (SELECT count(*)::integer FROM storage.objects
   WHERE bucket_id = 'device-photos' AND name = 'rlstest/photo-1.png'),
  1,
  'authenticated can INSERT an object into device-photos'
);

-- authenticated SELECT — the object is visible (read policy)
SELECT extensions.is(
  (SELECT count(*)::integer FROM storage.objects
   WHERE bucket_id = 'device-photos' AND name = 'rlstest/photo-1.png'),
  1,
  'authenticated can SELECT its device-photos object'
);

-- authenticated INSERT into checkout-photos — succeeds
INSERT INTO storage.objects (bucket_id, name)
VALUES ('checkout-photos', 'rlstest/checkout-1.png');

SELECT extensions.is(
  (SELECT count(*)::integer FROM storage.objects
   WHERE bucket_id = 'checkout-photos' AND name = 'rlstest/checkout-1.png'),
  1,
  'authenticated can INSERT an object into checkout-photos'
);

-- authenticated SELECT — the object is visible (read policy)
SELECT extensions.is(
  (SELECT count(*)::integer FROM storage.objects
   WHERE bucket_id = 'checkout-photos' AND name = 'rlstest/checkout-1.png'),
  1,
  'authenticated can SELECT its checkout-photos object'
);

-- authenticated INSERT into device-documents — succeeds
INSERT INTO storage.objects (bucket_id, name)
VALUES ('device-documents', 'rlstest/manual-1.txt');

SELECT extensions.is(
  (SELECT count(*)::integer FROM storage.objects
   WHERE bucket_id = 'device-documents' AND name = 'rlstest/manual-1.txt'),
  1,
  'authenticated can INSERT an object into device-documents'
);

-- authenticated UPDATE — succeeds (metadata change persists)
UPDATE storage.objects SET metadata = '{"tested": true}'::jsonb
WHERE bucket_id = 'device-photos' AND name = 'rlstest/photo-1.png';

SELECT extensions.is(
  (SELECT metadata->>'tested' FROM storage.objects
   WHERE bucket_id = 'device-photos' AND name = 'rlstest/photo-1.png'),
  'true',
  'authenticated can UPDATE a device-photos object'
);

RESET ROLE;

-- ============================================================
-- anon INSERT into device-photos — denied
-- ============================================================
SET LOCAL ROLE anon;

SELECT extensions.throws_ok(
  $$INSERT INTO storage.objects (bucket_id, name)
    VALUES ('device-photos', 'rlstest/anon.png')$$,
  NULL,
  'anon cannot INSERT into device-photos'
);

SELECT extensions.throws_ok(
  $$INSERT INTO storage.objects (bucket_id, name)
    VALUES ('checkout-photos', 'rlstest/anon-checkout.png')$$,
  NULL,
  'anon cannot INSERT into checkout-photos'
);

RESET ROLE;

-- ============================================================
-- Bucket scoping: authenticated cannot write to a non-device bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('rls-other', 'rls-other', false)
ON CONFLICT (id) DO NOTHING;

SET LOCAL ROLE authenticated;

SELECT extensions.throws_ok(
  $$INSERT INTO storage.objects (bucket_id, name)
    VALUES ('rls-other', 'rlstest/x.png')$$,
  NULL,
  'authenticated cannot INSERT into a non-device bucket (policies are bucket-scoped)'
);

RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
