-- ============================================================
-- 10_checkout_guard_test.sql
-- Verifies: private.enforce_checkout_availability() trigger rejects a
-- checkout that would push a device's outstanding loans above its
-- owned quantity, allows checkouts up to exactly that quantity, and
-- enforces the storage-only policy (repair/retired/lost blocked).
-- ============================================================
BEGIN;
SELECT plan(7);

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

-- Fixtures: seed has no devices/groups/manufacturers, so build the minimal
-- FK chain needed (group -> manufacturer -> device).
INSERT INTO public.groups (id, name)
VALUES ('a0000000-0010-0010-0010-000000000001'::uuid, 'Guard Test Group');

INSERT INTO public.manufacturers (id, name)
VALUES ('a0000000-0010-0010-0010-000000000002'::uuid, 'Guard Test Manufacturer');

-- accessory with quantity 5
INSERT INTO public.devices (id, code, name, group_id, manufacturer_id, quantity, condition, type)
VALUES (
  'a0000000-0010-0010-0010-000000000003'::uuid, 'DEV-900', 'Guard Test',
  'a0000000-0010-0010-0010-000000000001'::uuid,
  'a0000000-0010-0010-0010-000000000002'::uuid, 5, 100, 'accessory'
);

-- zero-stock accessory: in storage, but nothing available to lend
INSERT INTO public.devices (id, code, name, group_id, manufacturer_id, quantity, type)
VALUES ('a0000000-0010-0010-0010-000000000004'::uuid, 'DEV-904', 'Empty Stock',
        'a0000000-0010-0010-0010-000000000001'::uuid,
        'a0000000-0010-0010-0010-000000000002'::uuid, 0, 'accessory');

-- one device per blocked status (storage-only policy)
INSERT INTO public.devices (id, code, name, group_id, manufacturer_id, status)
VALUES
  ('a0000000-0010-0010-0010-000000000005'::uuid, 'DEV-901', 'In Repair',
   'a0000000-0010-0010-0010-000000000001'::uuid,
   'a0000000-0010-0010-0010-000000000002'::uuid, 'repair'),
  ('a0000000-0010-0010-0010-000000000006'::uuid, 'DEV-902', 'Retired',
   'a0000000-0010-0010-0010-000000000001'::uuid,
   'a0000000-0010-0010-0010-000000000002'::uuid, 'retired'),
  ('a0000000-0010-0010-0010-000000000007'::uuid, 'DEV-903', 'Lost',
   'a0000000-0010-0010-0010-000000000001'::uuid,
   'a0000000-0010-0010-0010-000000000002'::uuid, 'lost');

-- checkout of 3 is fine
SELECT extensions.lives_ok(
  $$ INSERT INTO public.checkouts (device_id, borrower_name, quantity)
     VALUES ('a0000000-0010-0010-0010-000000000003'::uuid, 'Alice', 3) $$,
  'checkout within available succeeds');

-- another checkout of 3 (total 6 > 5) must fail
SELECT extensions.throws_ok(
  $$ INSERT INTO public.checkouts (device_id, borrower_name, quantity)
     VALUES ('a0000000-0010-0010-0010-000000000003'::uuid, 'Bob', 3) $$,
  'P0001', NULL, 'over-checkout rejected');

-- a checkout of exactly the remaining 2 succeeds
SELECT extensions.lives_ok(
  $$ INSERT INTO public.checkouts (device_id, borrower_name, quantity)
     VALUES ('a0000000-0010-0010-0010-000000000003'::uuid, 'Carol', 2) $$,
  'checkout of remaining units succeeds');

-- zero stock: nothing to lend even though the accessory is in storage
SELECT extensions.throws_ok(
  $$ INSERT INTO public.checkouts (device_id, borrower_name, quantity)
     VALUES ('a0000000-0010-0010-0010-000000000004'::uuid, 'Dan', 1) $$,
  'P0001', NULL, 'checkout of zero-stock accessory rejected');

-- storage-only policy: repair / retired / lost devices reject new loans
SELECT extensions.throws_ok(
  $$ INSERT INTO public.checkouts (device_id, borrower_name, quantity)
     VALUES ('a0000000-0010-0010-0010-000000000005'::uuid, 'Dan', 1) $$,
  'P0001', NULL, 'checkout of repair device rejected');

SELECT extensions.throws_ok(
  $$ INSERT INTO public.checkouts (device_id, borrower_name, quantity)
     VALUES ('a0000000-0010-0010-0010-000000000006'::uuid, 'Dan', 1) $$,
  'P0001', NULL, 'checkout of retired device rejected');

SELECT extensions.throws_ok(
  $$ INSERT INTO public.checkouts (device_id, borrower_name, quantity)
     VALUES ('a0000000-0010-0010-0010-000000000007'::uuid, 'Dan', 1) $$,
  'P0001', NULL, 'checkout of lost device rejected');

SELECT * FROM finish();
ROLLBACK;
