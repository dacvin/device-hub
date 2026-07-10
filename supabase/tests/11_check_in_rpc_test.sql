-- ============================================================
-- 11_check_in_rpc_test.sql
-- Verifies: public.check_in() RPC — normal merge (condition overwrite),
-- consumed (quantity decrement), normal split (new device + provenance),
-- and rejection of a check-in beyond the checkout's outstanding quantity.
-- ============================================================
BEGIN;
SELECT plan(9);

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

-- Fixtures: seed has no groups/manufacturers/devices, so build the minimal
-- FK chain needed (group -> manufacturer -> device -> checkout).
INSERT INTO public.groups (id, name)
VALUES ('a0000000-0011-0011-0011-000000000001'::uuid, 'Check-in Test Group');

INSERT INTO public.manufacturers (id, name)
VALUES ('a0000000-0011-0011-0011-000000000002'::uuid, 'Check-in Test Manufacturer');

-- device with 5 units @ condition 100
INSERT INTO public.devices (id, code, name, group_id, manufacturer_id, quantity, condition)
VALUES ('22222222-2222-2222-2222-222222222222', 'DEV-910', 'RPC Test',
        'a0000000-0011-0011-0011-000000000001'::uuid,
        'a0000000-0011-0011-0011-000000000002'::uuid, 5, 100);

-- checkout 4 units
INSERT INTO public.checkouts (id, device_id, borrower_name, quantity)
VALUES ('33333333-3333-3333-3333-333333333333',
        '22222222-2222-2222-2222-222222222222', 'Dana', 4);

-- (a) normal merge return of 1 unit @ condition 80, no split
SELECT extensions.lives_ok(
  $$ SELECT public.check_in('33333333-3333-3333-3333-333333333333', 'normal', 1, 80) $$,
  'normal merge check-in succeeds');
SELECT extensions.is( (SELECT condition FROM public.devices WHERE id='22222222-2222-2222-2222-222222222222'),
           80, 'merge overwrites device condition');
SELECT extensions.is( (SELECT quantity FROM public.devices WHERE id='22222222-2222-2222-2222-222222222222'),
           5, 'merge does not change device quantity');

-- (b) consumed (tiêu hao) of 1 unit
SELECT extensions.lives_ok(
  $$ SELECT public.check_in('33333333-3333-3333-3333-333333333333', 'consumed', 1) $$,
  'consumed check-in succeeds');
SELECT extensions.is( (SELECT quantity FROM public.devices WHERE id='22222222-2222-2222-2222-222222222222'),
           4, 'consumed decrements device quantity');

-- (c) normal split return of 2 units @ condition 60
SELECT extensions.lives_ok(
  $$ SELECT public.check_in('33333333-3333-3333-3333-333333333333',
        'normal', 2, 60, '[]'::jsonb, null, true) $$,
  'split check-in succeeds');
SELECT extensions.is( (SELECT quantity FROM public.devices WHERE id='22222222-2222-2222-2222-222222222222'),
           2, 'split decrements source quantity');
SELECT extensions.ok(
  EXISTS(SELECT 1 FROM public.devices
         WHERE split_from_device_id='22222222-2222-2222-2222-222222222222'
           AND quantity=2 AND condition=60),
  'split created a child device with returned units + condition');

-- (d) over-return rejected: outstanding is now 0 (1 normal + 1 consumed + 2 split = 4)
SELECT extensions.throws_ok(
  $$ SELECT public.check_in('33333333-3333-3333-3333-333333333333', 'other', 1) $$,
  'P0001', NULL, 'check-in beyond outstanding is rejected');

SELECT * FROM finish();
ROLLBACK;
