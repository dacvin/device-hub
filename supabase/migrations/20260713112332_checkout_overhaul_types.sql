-- Hand-adjusted migration (documented deviation from the db-diff workflow):
-- `supabase db diff` cannot express enum VALUE renames — it generated a
-- drop/recreate of device_status + checkin_outcome, which breaks on rows
-- still holding 'in-use' (uncastable to the new enum) and on check_in(...),
-- whose signature depends on checkin_outcome. In-place equivalents instead.
-- Source of truth remains supabase/schemas/{devices,checkouts}.sql.

alter type public.device_status rename value 'in-use' to 'checked_out';
alter type public.device_status add value 'lost';

alter type public.checkin_outcome add value 'lost';

create type public.device_type as enum ('device', 'accessory');

alter table public.devices add column "type" public.device_type not null default 'device';

-- Backfill: bulk rows become accessories (DML is never captured by db diff).
-- quantity > 1, NOT <> 1: a serialized device previously drained to 0 by a
-- consumed/other check-in must stay a device.
update public.devices set "type" = 'accessory' where quantity > 1;
