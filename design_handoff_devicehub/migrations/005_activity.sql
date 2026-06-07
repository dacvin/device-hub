-- ============================================================
-- DeviceHub — migration 005: activity log
-- Backs the "Recent activity" timelines on Overview and Member profile,
-- and gives every create/update/status-change/delete an audit trail.
-- Run AFTER 003_members.sql (references member) and the device tables.
-- ============================================================

CREATE TYPE activity_action AS ENUM (
  'device.created', 'device.updated', 'device.status_changed',
  'device.deleted', 'device.restored',
  'device.inventory_checked', 'device.allocated',
  'member.invited', 'member.role_changed', 'member.removed',
  'catalog.created', 'catalog.updated', 'catalog.deleted',
  'settings.updated'
);

CREATE TABLE activity (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    uuid REFERENCES member(id) ON DELETE SET NULL,  -- who did it (NULL = system/job)
  action      activity_action NOT NULL,
  entity_type text NOT NULL,            -- 'device' | 'member' | 'department' | 'group' | 'manufacturer' | 'settings'
  entity_id   uuid,                     -- the affected row (nullable for settings singleton)
  entity_label text,                    -- denormalized for display ("Dell XPS 15", "DEV-2041-XPS")
  -- structured detail, e.g. {"from":"in-storage","to":"in-repair"} for a status change
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Newest-first reads, globally and scoped to one entity (device detail / member profile timeline)
CREATE INDEX activity_created_idx        ON activity(created_at DESC);
CREATE INDEX activity_entity_idx         ON activity(entity_type, entity_id, created_at DESC);
CREATE INDEX activity_actor_idx          ON activity(actor_id, created_at DESC);

-- ============================================================
-- Usage
-- ---------------------------------------------------------------
-- Write one row in the same transaction as each mutation (or via a
-- trigger / app-layer logActivity()). Examples:
--   INSERT INTO activity(actor_id, action, entity_type, entity_id, entity_label, metadata)
--   VALUES (:me, 'device.status_changed', 'device', :id, :code,
--           jsonb_build_object('from','in-storage','to','in-repair'));
--
-- Overview "Recent activity" (newest 5, workspace-wide):
--   SELECT a.*, m.name AS actor_name
--   FROM activity a LEFT JOIN member m ON m.id = a.actor_id
--   ORDER BY a.created_at DESC LIMIT 5;
--
-- Member profile timeline (what this member did):
--   SELECT * FROM activity WHERE actor_id = :member_id
--   ORDER BY created_at DESC LIMIT 10;
--
-- Device detail timeline (what happened to this device):
--   SELECT * FROM activity WHERE entity_type = 'device' AND entity_id = :device_id
--   ORDER BY created_at DESC;
--
-- RLS: enable and allow SELECT to all authenticated members (read-only);
-- INSERT only via service role / SECURITY DEFINER logging function.
-- ============================================================
