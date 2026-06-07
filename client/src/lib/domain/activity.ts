import type { Database } from "@/types/database.types";

export type ActivityRow = Database["public"]["Tables"]["activity"]["Row"];
export type ActivityAction = ActivityRow["action"];

export interface Activity {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: ActivityAction;
  entityType: string;
  entityId: string | null;
  entityLabel: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export const ACTIVITY_META: Record<ActivityAction, { icon: string; verbKey: string }> = {
  "device.created":           { icon: "plus",            verbKey: "deviceCreated" },
  "device.updated":           { icon: "pencil",          verbKey: "deviceUpdated" },
  "device.status_changed":    { icon: "activity",        verbKey: "deviceStatusChanged" },
  "device.deleted":           { icon: "trash-2",         verbKey: "deviceDeleted" },
  "device.restored":          { icon: "rotate-ccw",      verbKey: "deviceRestored" },
  "device.inventory_checked": { icon: "clipboard-check", verbKey: "deviceInventoryChecked" },
  "device.allocated":         { icon: "user-plus",       verbKey: "deviceAllocated" },
  "member.invited":           { icon: "mail",            verbKey: "memberInvited" },
  "member.role_changed":      { icon: "shield",          verbKey: "memberRoleChanged" },
  "member.removed":           { icon: "user-minus",      verbKey: "memberRemoved" },
  "catalog.created":          { icon: "plus",            verbKey: "catalogCreated" },
  "catalog.updated":          { icon: "pencil",          verbKey: "catalogUpdated" },
  "catalog.deleted":          { icon: "trash-2",         verbKey: "catalogDeleted" },
  "settings.updated":         { icon: "settings",        verbKey: "settingsUpdated" },
};

type ActivityJoinedRow = ActivityRow & { actor: { name: string } | null };

export function mapActivityRow(row: ActivityJoinedRow): Activity {
  return {
    id: row.id,
    actorId: row.actor_id,
    actorName: row.actor?.name ?? null,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityLabel: row.entity_label,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
  };
}
