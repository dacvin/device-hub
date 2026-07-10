-- ============================================================
-- 12_loan_status_view_test.sql
-- Verifies: public.device_loan_status derives available/on_loan/has_overdue
-- correctly for a device with an active, past-due checkout.
-- ============================================================
BEGIN;
SELECT plan(3);

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

-- Fixtures: seed has no groups/manufacturers/devices, so build the minimal
-- FK chain needed (group -> manufacturer -> device -> checkout).
INSERT INTO public.groups (id, name)
VALUES ('a0000000-0012-0012-0012-000000000001'::uuid, 'Loan Status Test Group');

INSERT INTO public.manufacturers (id, name)
VALUES ('a0000000-0012-0012-0012-000000000002'::uuid, 'Loan Status Test Manufacturer');

INSERT INTO public.devices (id, code, name, group_id, manufacturer_id, quantity, condition)
VALUES ('44444444-4444-4444-4444-444444444444', 'DEV-920', 'View Test',
        'a0000000-0012-0012-0012-000000000001'::uuid,
        'a0000000-0012-0012-0012-000000000002'::uuid, 10, 100);

INSERT INTO public.checkouts (device_id, borrower_name, quantity, expected_return_date)
VALUES ('44444444-4444-4444-4444-444444444444', 'Eve', 3, current_date - 1);

SELECT extensions.is(
  (SELECT available FROM public.device_loan_status
   WHERE device_id = '44444444-4444-4444-4444-444444444444'),
  7, 'available = total - on_loan');

SELECT extensions.is(
  (SELECT on_loan FROM public.device_loan_status
   WHERE device_id = '44444444-4444-4444-4444-444444444444'),
  3, 'on_loan sums outstanding');

SELECT extensions.is(
  (SELECT has_overdue FROM public.device_loan_status
   WHERE device_id = '44444444-4444-4444-4444-444444444444'),
  true, 'past-due active checkout flags overdue');

SELECT * FROM finish();
ROLLBACK;
