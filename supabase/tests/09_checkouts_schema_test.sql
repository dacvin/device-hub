-- ============================================================
-- 09_checkouts_schema_test.sql
-- Verifies: checkouts/checkins tables exist with correct shape,
-- devices.split_from_device_id provenance + type columns exist, the
-- status/outcome/type enums carry the expected labels, RLS is enabled,
-- and quantity/type check constraints reject bad rows.
-- ============================================================
BEGIN;
SELECT plan(20);

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

-- Fixtures: seed has no devices/checkouts, so build the minimal FK chain
-- needed for the throws_ok inserts below (group -> manufacturer -> device
-- -> checkout). The device is an accessory with headroom: a fully-loaned
-- device would flip to 'checked_out' (sync trigger) and the quantity-0
-- insert below would then trip the status guard instead of the check
-- constraint under test.
INSERT INTO public.groups (id, name)
VALUES ('a0000000-0009-0009-0009-000000000001'::uuid, 'Checkout Test Group');

INSERT INTO public.manufacturers (id, name)
VALUES ('a0000000-0009-0009-0009-000000000002'::uuid, 'Checkout Test Manufacturer');

INSERT INTO public.devices (id, code, name, group_id, manufacturer_id, quantity, type)
VALUES (
  'a0000000-0009-0009-0009-000000000003'::uuid, 'CHKTEST-001', 'Checkout Test Device',
  'a0000000-0009-0009-0009-000000000001'::uuid, 'a0000000-0009-0009-0009-000000000002'::uuid,
  2, 'accessory'
);

INSERT INTO public.checkouts (id, device_id, borrower_name, quantity)
VALUES (
  'a0000000-0009-0009-0009-000000000004'::uuid,
  'a0000000-0009-0009-0009-000000000003'::uuid, 'Fixture Borrower', 1
);

SELECT extensions.has_table('public', 'checkouts', 'checkouts table exists');
SELECT extensions.has_table('public', 'checkins',  'checkins table exists');
SELECT extensions.has_column('public', 'devices', 'split_from_device_id', 'devices has split_from_device_id');
SELECT extensions.has_column('public', 'devices', 'type', 'devices has type');
SELECT extensions.has_column('public', 'checkins', 'outcome', 'checkins has outcome');

-- enum label sets
SELECT extensions.enum_has_labels('public', 'device_status',
  ARRAY['checked_out', 'storage', 'repair', 'retired', 'lost'],
  'device_status labels');
SELECT extensions.enum_has_labels('public', 'checkin_outcome',
  ARRAY['normal', 'consumed', 'other', 'lost'],
  'checkin_outcome labels');
SELECT extensions.enum_has_labels('public', 'device_type',
  ARRAY['device', 'accessory'],
  'device_type labels');

SELECT extensions.col_is_pk('public', 'checkouts', 'id', 'checkouts pk');
SELECT extensions.col_not_null('public', 'checkouts', 'device_id', 'checkouts.device_id not null');
SELECT extensions.col_not_null('public', 'checkouts', 'borrower_name', 'borrower_name not null');
SELECT extensions.col_has_default('public', 'checkouts', 'checked_out_by', 'checked_out_by defaults');

SELECT extensions.col_is_pk('public', 'checkins', 'id', 'checkins pk');
SELECT extensions.col_not_null('public', 'checkins', 'outcome', 'checkins.outcome not null');

-- RLS enabled
SELECT extensions.is(relrowsecurity, true, 'checkouts RLS on')
  FROM pg_class WHERE oid = 'public.checkouts'::regclass;
SELECT extensions.is(relrowsecurity, true, 'checkins RLS on')
  FROM pg_class WHERE oid = 'public.checkins'::regclass;

-- quantity >= 1 constraints reject bad rows
SELECT extensions.throws_ok(
  $$ INSERT INTO public.checkouts (device_id, borrower_name, quantity)
     VALUES ('a0000000-0009-0009-0009-000000000003'::uuid, 'X', 0) $$,
  '23514', NULL, 'checkout quantity must be >= 1');

SELECT extensions.throws_ok(
  $$ INSERT INTO public.checkins (checkout_id, outcome, quantity)
     VALUES ('a0000000-0009-0009-0009-000000000004'::uuid, 'normal', 0) $$,
  '23514', NULL, 'checkin quantity must be >= 1');

-- serialized devices hold at most one unit; accessories may sit at 0
SELECT extensions.throws_ok(
  $$ INSERT INTO public.devices (code, name, group_id, manufacturer_id, quantity, type)
     VALUES ('CHKTEST-002', 'Two-unit Device',
             'a0000000-0009-0009-0009-000000000001'::uuid,
             'a0000000-0009-0009-0009-000000000002'::uuid, 2, 'device') $$,
  '23514', NULL, 'type=device rejects quantity > 1');

SELECT extensions.lives_ok(
  $$ INSERT INTO public.devices (code, name, group_id, manufacturer_id, quantity, type)
     VALUES ('CHKTEST-003', 'Empty Accessory',
             'a0000000-0009-0009-0009-000000000001'::uuid,
             'a0000000-0009-0009-0009-000000000002'::uuid, 0, 'accessory') $$,
  'accessory at quantity 0 is allowed');

SELECT * FROM finish();
ROLLBACK;
