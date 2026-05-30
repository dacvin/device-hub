-- ============================================================
-- DeviceHub — derived status view
-- security_invoker = true so the view evaluates RLS as the calling user.
-- ============================================================

create view device_with_status with (security_invoker = true) as
select d.*,
  case
    when d.deleted_at is not null or d.is_retired                       then 'retired'
    when d.condition < 40                                               then 'faulty'
    when d.warranty_end is not null
         and d.warranty_end <= current_date + interval '90 days'
         and d.warranty_end >= current_date                             then 'warranty'
    when d.last_check_date is not null
         and d.last_check_date < current_date
             - (d.inventory_cycle_months || ' months')::interval        then 'inventory'
    when d.location is null                                             then 'storage'
    else 'in-use'
  end as status
from device d;
