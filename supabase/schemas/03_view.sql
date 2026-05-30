-- ============================================================
-- DeviceHub — derived FLAGS view (read-time)
-- security_invoker = true so the view evaluates RLS as the calling user.
-- Status is STORED on device; this view layers two DERIVED booleans
-- (warranty-expiring + inventory-overdue) per the handoff spec.
-- Flags are independent of status and of each other — a device may
-- carry zero, one, or both.
-- ============================================================

create view device_with_flags with (security_invoker = true) as
select d.*,
  -- warranty ends within the next 90 days (and not already expired)
  (d.status <> 'retired'
   and d.warranty_end is not null
   and d.warranty_end >= current_date
   and d.warranty_end <= current_date + interval '90 days')          as flag_warranty_expiring,
  -- last check older than the inventory cycle
  (d.status <> 'retired'
   and d.last_check_date is not null
   and d.last_check_date < current_date
       - (d.inventory_cycle_months || ' months')::interval)          as flag_inventory_overdue
from device d;
