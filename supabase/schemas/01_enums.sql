-- ============================================================
-- DeviceHub — enums
-- Status is a STORED lifecycle enum (mutually exclusive). Flags are DERIVED
-- at read time via the device_with_flags view (see 03_view.sql).
-- ============================================================

create type unit          as enum ('piece', 'set', 'box');
create type device_source as enum ('Purchased', 'Leased', 'Donated', 'Transferred');

-- Lifecycle status: a device is exactly ONE of these at a time. STORED, set by
-- admins (assign → in-use, send to service → in-repair, decommission → retired).
create type device_status as enum ('in-use', 'in-storage', 'in-repair', 'retired');
