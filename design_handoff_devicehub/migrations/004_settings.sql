-- ============================================================
-- DeviceHub — migration 004: settings
-- Adds org-wide settings (singleton) + per-user preferences.
--
-- Design rules (see also: deriveFlags in types.ts):
--   * Settings NEVER get columns on `device`.
--   * WRITE-TIME settings (code prefix, autogenerate, default site,
--     default inventory cycle) are applied only at INSERT and
--     materialized into the row — changing them later does NOT
--     rewrite history (device.code is a stable identifier).
--   * READ-TIME settings (condition thresholds, warranty window)
--     are applied at render/derivation time, never stored — so a
--     change re-colors bars / re-evaluates flags with no backfill.
--
-- Purely additive: two new tables, no lock on `device`, no backfill.
-- ============================================================

-- ---- Org-wide settings: exactly ONE row, enforced by a fixed PK ----
CREATE TABLE org_settings (
  id                              boolean PRIMARY KEY DEFAULT true CHECK (id),  -- singleton guard

  -- General
  org_name                        text NOT NULL DEFAULT 'Sioux Asia',
  primary_site                    text,                          -- write-time default location for new devices
  date_format                     text NOT NULL DEFAULT 'DD MMM YYYY',

  -- Inventory defaults (WRITE-TIME — applied at device INSERT only)
  code_prefix                     text NOT NULL DEFAULT 'DEV-',
  code_autogenerate               boolean NOT NULL DEFAULT true,
  default_inventory_cycle_months  int  NOT NULL DEFAULT 12 CHECK (default_inventory_cycle_months BETWEEN 1 AND 120),

  -- Condition thresholds (READ-TIME — display only, never stored on a device)
  condition_good_pct              int  NOT NULL DEFAULT 70 CHECK (condition_good_pct BETWEEN 0 AND 100),
  condition_fair_pct              int  NOT NULL DEFAULT 40 CHECK (condition_fair_pct BETWEEN 0 AND 100),
  CHECK (condition_fair_pct <= condition_good_pct),

  -- Warranty window (READ-TIME — feeds the warranty-expiring flag; see gotcha below)
  warranty_expiring_days          int  NOT NULL DEFAULT 90 CHECK (warranty_expiring_days BETWEEN 1 AND 365),

  -- Notifications (job config)
  notify_warranty                 boolean NOT NULL DEFAULT true,
  notify_inventory_overdue        boolean NOT NULL DEFAULT true,
  notify_weekly_summary           boolean NOT NULL DEFAULT true,
  notify_new_device               boolean NOT NULL DEFAULT false,

  -- Data & export (job config)
  export_format                   text NOT NULL DEFAULT 'CSV' CHECK (export_format IN ('CSV', 'XLSX', 'PDF')),
  deleted_retention_days          int  NOT NULL DEFAULT 30 CHECK (deleted_retention_days BETWEEN 0 AND 3650),

  -- Audit — settings that change data behavior deserve a trail
  updated_by                      uuid,
  updated_at                      timestamptz NOT NULL DEFAULT now()
);

-- Seed the single row so app reads never hit a null.
INSERT INTO org_settings (id) VALUES (true);

-- ---- Per-user preferences (display only; safe to also mirror to localStorage) ----
CREATE TABLE user_preference (
  user_id              uuid PRIMARY KEY,            -- FK to your member/user table
  theme                text NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  default_device_view  text NOT NULL DEFAULT 'table' CHECK (default_device_view IN ('table', 'cards')),
  mono_codes           boolean NOT NULL DEFAULT true,
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- GOTCHA: the original device_with_flags view HARDCODED the 90-day
-- warranty window. Now that the window is configurable, replace the
-- view with a function parameterized by the setting. (Alternatively,
-- derive flags in the app layer via deriveFlags(d, opts) and drop the
-- SQL derivation entirely — see types.ts.)
--
-- Resolution order for inventory cycle is decided at INSERT in the app:
--   explicit device value -> else group.default_inventory_cycle_months
--   -> else org_settings.default_inventory_cycle_months
-- ...then the resolved number is STORED on device.inventory_cycle_months,
-- so flag derivation stays per-row and simple.
-- ============================================================

DROP VIEW IF EXISTS device_with_flags;

CREATE FUNCTION devices_with_flags(p_warranty_days int DEFAULT 90)
RETURNS TABLE (
  LIKE device,
  flag_warranty_expiring boolean,
  flag_inventory_overdue boolean
)
LANGUAGE sql STABLE AS $$
  SELECT d.*,
    (d.status <> 'retired'
     AND d.warranty_end IS NOT NULL
     AND d.warranty_end >= current_date
     AND d.warranty_end <= current_date + (p_warranty_days || ' days')::interval)  AS flag_warranty_expiring,
    (d.status <> 'retired'
     AND d.last_check_date IS NOT NULL
     AND d.last_check_date < current_date
         - (d.inventory_cycle_months || ' months')::interval)                      AS flag_inventory_overdue
  FROM device d;
$$;

-- Usage:
--   SELECT * FROM devices_with_flags((SELECT warranty_expiring_days FROM org_settings));
