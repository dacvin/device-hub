-- ============================================================
-- 14_status_transitions_test.sql
-- Verifies: private.sync_device_checkout_status() keeps devices.status
-- in step with loan math — storage → checked_out when the last unit goes
-- out, back to storage when stock frees up (check-in or checkout
-- deletion), never stomps a manually-set repair status — and the stock
-- floor rejects quantity edits below the outstanding loans.
-- ============================================================
BEGIN;
SELECT plan(10);

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

INSERT INTO public.groups (id, name)
VALUES ('a0000000-0014-0014-0014-000000000001'::uuid, 'Transition Test Group');

INSERT INTO public.manufacturers (id, name)
VALUES ('a0000000-0014-0014-0014-000000000002'::uuid, 'Transition Test Manufacturer');

-- serialized device (quantity 1)
INSERT INTO public.devices (id, code, name, group_id, manufacturer_id)
VALUES ('a0000000-0014-0014-0014-000000000003'::uuid, 'TRN-001', 'Serialized',
        'a0000000-0014-0014-0014-000000000001'::uuid,
        'a0000000-0014-0014-0014-000000000002'::uuid);

-- accessory with 3 units
INSERT INTO public.devices (id, code, name, group_id, manufacturer_id, quantity, type)
VALUES ('a0000000-0014-0014-0014-000000000004'::uuid, 'TRN-002', 'Bulk',
        'a0000000-0014-0014-0014-000000000001'::uuid,
        'a0000000-0014-0014-0014-000000000002'::uuid, 3, 'accessory');

-- (a) serialized device: full loan flips to checked_out, return flips back
INSERT INTO public.checkouts (id, device_id, borrower_name, quantity)
VALUES ('a0000000-0014-0014-0014-000000000005'::uuid,
        'a0000000-0014-0014-0014-000000000003'::uuid, 'Alice', 1);

SELECT extensions.is(
  (SELECT status FROM public.devices WHERE id = 'a0000000-0014-0014-0014-000000000003'::uuid),
  'checked_out'::public.device_status, 'full loan flips serialized device to checked_out');

SELECT public.check_in('a0000000-0014-0014-0014-000000000005'::uuid, 'normal', 1);

SELECT extensions.is(
  (SELECT status FROM public.devices WHERE id = 'a0000000-0014-0014-0014-000000000003'::uuid),
  'storage'::public.device_status, 'full return flips serialized device back to storage');

-- (b) accessory: partial loan stays storage, last unit out flips it
INSERT INTO public.checkouts (id, device_id, borrower_name, quantity)
VALUES ('a0000000-0014-0014-0014-000000000006'::uuid,
        'a0000000-0014-0014-0014-000000000004'::uuid, 'Bob', 2);

SELECT extensions.is(
  (SELECT status FROM public.devices WHERE id = 'a0000000-0014-0014-0014-000000000004'::uuid),
  'storage'::public.device_status, 'partial loan keeps accessory in storage');

INSERT INTO public.checkouts (id, device_id, borrower_name, quantity)
VALUES ('a0000000-0014-0014-0014-000000000007'::uuid,
        'a0000000-0014-0014-0014-000000000004'::uuid, 'Carol', 1);

SELECT extensions.is(
  (SELECT status FROM public.devices WHERE id = 'a0000000-0014-0014-0014-000000000004'::uuid),
  'checked_out'::public.device_status, 'last unit out flips accessory to checked_out');

-- (c) partial return frees stock → back to storage
SELECT public.check_in('a0000000-0014-0014-0014-000000000006'::uuid, 'normal', 1);

SELECT extensions.is(
  (SELECT status FROM public.devices WHERE id = 'a0000000-0014-0014-0014-000000000004'::uuid),
  'storage'::public.device_status, 'partial return flips accessory back to storage');

-- (d) deleting a checkout (correction) resyncs the device
INSERT INTO public.checkouts (id, device_id, borrower_name, quantity)
VALUES ('a0000000-0014-0014-0014-000000000008'::uuid,
        'a0000000-0014-0014-0014-000000000004'::uuid, 'Dave', 1);

SELECT extensions.is(
  (SELECT status FROM public.devices WHERE id = 'a0000000-0014-0014-0014-000000000004'::uuid),
  'checked_out'::public.device_status, 'refilled loan flips accessory to checked_out again');

DELETE FROM public.checkouts WHERE id = 'a0000000-0014-0014-0014-000000000008'::uuid;

SELECT extensions.is(
  (SELECT status FROM public.devices WHERE id = 'a0000000-0014-0014-0014-000000000004'::uuid),
  'storage'::public.device_status, 'deleting a checkout resyncs the accessory to storage');

-- (e) manual repair status is never stomped by the sync
UPDATE public.devices SET status = 'repair'
WHERE id = 'a0000000-0014-0014-0014-000000000004'::uuid;

SELECT public.check_in('a0000000-0014-0014-0014-000000000006'::uuid, 'normal', 1);

SELECT extensions.is(
  (SELECT status FROM public.devices WHERE id = 'a0000000-0014-0014-0014-000000000004'::uuid),
  'repair'::public.device_status, 'check-in never stomps a manual repair status');

-- (f) stock floor: Carol still has 1 unit out — quantity cannot drop below it
SELECT extensions.throws_ok(
  $$ UPDATE public.devices SET quantity = 0
     WHERE id = 'a0000000-0014-0014-0014-000000000004'::uuid $$,
  'P0001', NULL, 'quantity edit below outstanding loans is rejected');

SELECT extensions.lives_ok(
  $$ UPDATE public.devices SET quantity = 1
     WHERE id = 'a0000000-0014-0014-0014-000000000004'::uuid $$,
  'quantity edit down to exactly the outstanding loans succeeds');

SELECT * FROM finish();
ROLLBACK;
