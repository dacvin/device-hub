-- ============================================================
-- 13_device_depletion_test.sql
-- Verifies: a check-in that consumes all outstanding units of a
-- device is allowed to drain devices.quantity to 0 (no soft-delete;
-- depleted devices stay visible at quantity 0).
-- ============================================================
BEGIN;
SELECT plan(3);

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

-- Fixtures: seed has no groups/manufacturers/devices, so build the minimal
-- FK chain needed (group -> manufacturer -> device -> checkout).
INSERT INTO public.groups (id, name)
VALUES ('a0000000-0013-0013-0013-000000000001'::uuid, 'Depletion Test Group');

INSERT INTO public.manufacturers (id, name)
VALUES ('a0000000-0013-0013-0013-000000000002'::uuid, 'Depletion Test Manufacturer');

-- accessory with 2 units
INSERT INTO public.devices (id, code, name, group_id, manufacturer_id, quantity, type)
VALUES ('a0000000-0013-0013-0013-000000000003'::uuid, 'DEPTEST-001', 'Depletion Test Device',
        'a0000000-0013-0013-0013-000000000001'::uuid,
        'a0000000-0013-0013-0013-000000000002'::uuid, 2, 'accessory');

-- checkout all 2 units
INSERT INTO public.checkouts (id, device_id, borrower_name, quantity)
VALUES ('a0000000-0013-0013-0013-000000000004'::uuid,
        'a0000000-0013-0013-0013-000000000003'::uuid, 'Depletion Test Borrower', 2);

-- consumed check-in of all 2 units drains the device to 0
SELECT extensions.lives_ok(
  $$ SELECT public.check_in('a0000000-0013-0013-0013-000000000004'::uuid, 'consumed', 2) $$,
  'full-drain consumed check-in does not raise'
);

SELECT extensions.is(
  (SELECT quantity FROM public.devices WHERE id = 'a0000000-0013-0013-0013-000000000003'::uuid),
  0,
  'device quantity is drained to 0'
);

-- consumed-to-0 keeps the record in storage (only a LOST drain marks it
-- lost); the sync trigger returns it from checked_out since on_loan = 0
SELECT extensions.is(
  (SELECT status FROM public.devices WHERE id = 'a0000000-0013-0013-0013-000000000003'::uuid),
  'storage'::public.device_status,
  'consumed drain leaves the device in storage'
);

SELECT * FROM finish();
ROLLBACK;
