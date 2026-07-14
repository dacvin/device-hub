-- ============================================================
-- 12_loan_status_view_test.sql
-- Verifies: public.device_loan_status derives available/on_loan/has_overdue
-- correctly for a device with an active, past-due checkout, and keeps its
-- security posture (security_invoker on, no anon access) — a recreated
-- view silently loses both.
-- ============================================================
BEGIN;
SELECT plan(6);

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

-- Fixtures: seed has no groups/manufacturers/devices, so build the minimal
-- FK chain needed (group -> manufacturer -> device -> checkout).
INSERT INTO public.groups (id, name)
VALUES ('a0000000-0012-0012-0012-000000000001'::uuid, 'Loan Status Test Group');

INSERT INTO public.manufacturers (id, name)
VALUES ('a0000000-0012-0012-0012-000000000002'::uuid, 'Loan Status Test Manufacturer');

INSERT INTO public.devices (id, code, name, group_id, manufacturer_id, quantity, condition, type)
VALUES ('44444444-4444-4444-4444-444444444444', 'DEV-920', 'View Test',
        'a0000000-0012-0012-0012-000000000001'::uuid,
        'a0000000-0012-0012-0012-000000000002'::uuid, 10, 100, 'accessory');

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

-- a lost check-in removes the units from both sides of the equation:
-- total drops with device.quantity, on_loan drops with the closed loan
SELECT public.check_in(
  (SELECT id FROM public.checkouts
   WHERE device_id = '44444444-4444-4444-4444-444444444444'),
  'lost', 3);

SELECT extensions.is(
  (SELECT (total, on_loan, available)::text
   FROM public.device_loan_status
   WHERE device_id = '44444444-4444-4444-4444-444444444444'),
  '(7,0,7)', 'lost check-in shrinks total and clears on_loan');

-- security posture: invoker rights + no anon grant (both are silently lost
-- if the view is ever dropped and recreated)
SELECT extensions.ok(
  (SELECT coalesce(array_to_string(reloptions, ',') ~ 'security_invoker=(on|true)', false)
   FROM pg_class WHERE oid = 'public.device_loan_status'::regclass),
  'device_loan_status runs with invoker rights');

SELECT extensions.ok(
  NOT has_table_privilege('anon', 'public.device_loan_status', 'SELECT'),
  'anon cannot select from device_loan_status');

SELECT * FROM finish();
ROLLBACK;
