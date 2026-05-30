-- ============================================================
-- DeviceHub — enums
-- Status is DERIVED at read time via device_with_status (see 03_view.sql).
-- ============================================================

create type unit          as enum ('piece', 'set', 'box');
create type device_source as enum ('Purchased', 'Leased', 'Donated', 'Transferred');
