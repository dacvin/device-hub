-- ============================================================
-- DeviceHub — migration 003: members & access
-- Backs the Members list + Member profile screens.
-- Run AFTER schema.sql and BEFORE 004_settings.sql
-- (004's user_preference.user_id and org_settings.updated_by
--  reference member(id)).
-- ============================================================

-- Roles are a closed set. Stored as a compact enum; the UI shows the
-- display labels in member_role_label() (IT Admin / Manager / Viewer).
CREATE TYPE member_role   AS ENUM ('it_admin', 'manager', 'viewer');

-- Lifecycle of a member account. 'invited' = emailed, not yet accepted.
CREATE TYPE member_status AS ENUM ('active', 'invited', 'disabled');

CREATE TABLE member (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  email          text NOT NULL UNIQUE,            -- must be an IT-managed @sioux.asia address
  role           member_role   NOT NULL DEFAULT 'viewer',
  status         member_status NOT NULL DEFAULT 'invited',

  department_id  uuid REFERENCES department(id) ON DELETE SET NULL,
  site           text,                             -- primary office (HCMC, Hanoi, …)
  phone          text,
  reports_to     uuid REFERENCES member(id) ON DELETE SET NULL,  -- self-FK ("Reports to")

  joined_at      date,                             -- "Member since"
  last_active_at timestamptz,                       -- drives "Last active"
  invited_by     uuid REFERENCES member(id) ON DELETE SET NULL,

  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX member_department_idx ON member(department_id);
CREATE INDEX member_role_idx       ON member(role);

-- Display label for a role (UI shows these; DB stores the enum).
CREATE FUNCTION member_role_label(r member_role) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE r
    WHEN 'it_admin' THEN 'IT Admin'
    WHEN 'manager'  THEN 'Manager'
    WHEN 'viewer'   THEN 'Viewer'
  END;
$$;

-- ============================================================
-- DERIVED, not stored:
--
-- 1. Permissions / capabilities — a pure function of role (see the
--    capability matrix in types.ts -> CAPABILITIES). The "Permissions"
--    card on the profile renders this matrix; do NOT add a per-member
--    permissions table.
--      it_admin → everything
--      manager  → view + manage devices in own dept + export
--      viewer   → view only
--
-- 2. "Devices managed" — a Manager/Admin manages the devices in their
--    OWN department; it is derived by department_id, NOT a stored
--    assignment. The profile's "Devices managed" list and count are:
--      SELECT * FROM device d
--      WHERE d.department_id = :member_department_id
--        AND d.deleted_at IS NULL;
--    (Viewers manage none — read-only.) If you later need explicit
--    per-device ownership, add device.managed_by uuid REFERENCES member(id).
-- ============================================================
