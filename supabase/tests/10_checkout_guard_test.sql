-- ============================================================
-- 10_checkout_guard_test.sql
-- Verifies: private.enforce_checkout_availability() trigger rejects a
-- checkout that would push a device's outstanding loans above its
-- owned quantity, and allows checkouts up to exactly that quantity.
-- ============================================================
BEGIN;
SELECT plan(3);

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

-- Fixtures: seed has no devices/groups/manufacturers, so build the minimal
-- FK chain needed (group -> manufacturer -> device).
INSERT INTO public.groups (id, name)
VALUES ('a0000000-0010-0010-0010-000000000001'::uuid, 'Guard Test Group');

INSERT INTO public.manufacturers (id, name)
VALUES ('a0000000-0010-0010-0010-000000000002'::uuid, 'Guard Test Manufacturer');

-- device with quantity 5
INSERT INTO public.devices (id, code, name, group_id, manufacturer_id, quantity, condition)
VALUES (
  'a0000000-0010-0010-0010-000000000003'::uuid, 'DEV-900', 'Guard Test',
  'a0000000-0010-0010-0010-000000000001'::uuid,
  'a0000000-0010-0010-0010-000000000002'::uuid, 5, 100
);

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

SELECT * FROM finish();
ROLLBACK;
