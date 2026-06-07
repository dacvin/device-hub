-- ============================================================
-- DeviceHub — derived FLAGS
-- The original view hardcoded a 90-day warranty window. Now that
-- the window is configurable (org_settings.warranty_expiring_days),
-- flag derivation lives in the function `devices_with_flags(int)`
-- defined in 09_settings.sql.
-- ============================================================

-- (intentionally empty — view definition replaced by function)
