// ============================================================
// DeviceHub — TypeScript types + Zod form schemas
// Mirrors schema.sql. The DB is the source of truth; these are the
// app-layer contract: row types for reads, Zod schemas for the
// Create/Edit forms (wire into shadcn <Form> via zodResolver).
// ============================================================

import { z } from "zod";

/* ---------- Enums ---------- */
export const UNITS = ["piece", "set", "box"] as const;
export type Unit = (typeof UNITS)[number];

export const SOURCES = ["Purchased", "Leased", "Donated", "Transferred"] as const;
export type DeviceSource = (typeof SOURCES)[number];

// Lifecycle status — STORED, mutually exclusive (set by admins).
export const DEVICE_STATUSES = ["in-use", "in-storage", "in-repair", "retired"] as const;
export type DeviceStatus = (typeof DEVICE_STATUSES)[number];

// Attention flags — DERIVED, independent, can stack. Never stored.
export const DEVICE_FLAGS = ["warranty-expiring", "inventory-overdue"] as const;
export type DeviceFlag = (typeof DEVICE_FLAGS)[number];

/* ---------- Row types (DB reads) ---------- */
export interface Department {
  id: string;
  name: string;
  manager?: string | null;
  primaryLocation?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceGroup {
  id: string;
  name: string;
  icon?: string | null; // lucide icon name
  defaultInventoryCycleMonths: number;
  createdAt: string;
  updatedAt: string;
}

export interface Manufacturer {
  id: string;
  name: string;
  supportContact?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DevicePhoto {
  id: string;
  deviceId: string;
  url: string;
  fileName?: string | null;
  sizeBytes?: number | null; // <= 5 MB
  sortOrder: number; // 0 = cover
  createdAt: string;
}

export interface DeviceDocument {
  id: string;
  deviceId: string;
  url: string;
  fileName: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  createdAt: string;
}

export interface Device {
  id: string;
  code: string;
  name: string;
  groupId: string;
  departmentId: string;
  manufacturerId?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  specifications?: string | null;
  notes?: string | null;
  condition: number; // 0–100
  location?: string | null;
  quantity: number; // >= 1
  unit: Unit;
  source?: DeviceSource | null;
  status: DeviceStatus; // stored lifecycle state
  importDate?: string | null;
  lastCheckDate?: string | null;
  inventoryCycleMonths: number;
  warrantyStart?: string | null;
  warrantyEnd?: string | null;
  coverPhotoId?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Read shape with derived flags attached (see device_with_flags view / deriveFlags).
export interface DeviceWithFlags extends Device {
  flags: DeviceFlag[];
}

/* ---------- Zod: Create / Edit device form ---------- */
// Only the fields the form actually edits. Uploads are handled separately
// (presigned upload → arrays of {url,...}); the form holds references.
export const deviceFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  code: z
    .string()
    .min(1, "Code is required")
    .regex(/^DEV-[A-Z0-9-]+$/i, "Use the DEV-XXXX-XXX format"),
  groupId: z.string().uuid("Choose a group"),
  departmentId: z.string().uuid("Choose a department"),
  manufacturerId: z.string().uuid().optional().nullable(),
  model: z.string().max(120).optional().or(z.literal("")),
  serialNumber: z.string().max(120).optional().or(z.literal("")),
  specifications: z.string().max(2000).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  condition: z.coerce.number().int().min(0).max(100),
  location: z.string().max(200).optional().or(z.literal("")),
  quantity: z.coerce.number().int().min(1, "At least 1"),
  unit: z.enum(UNITS),
  source: z.enum(SOURCES).optional().nullable(),
  status: z.enum(DEVICE_STATUSES),
  importDate: z.coerce.date().optional().nullable(),
  lastCheckDate: z.coerce.date().optional().nullable(),
  inventoryCycleMonths: z.coerce.number().int().min(1).max(120),
  warrantyStart: z.coerce.date().optional().nullable(),
  warrantyEnd: z.coerce.date().optional().nullable(),
}).refine(
  (d) => !d.warrantyStart || !d.warrantyEnd || d.warrantyEnd >= d.warrantyStart,
  { path: ["warrantyEnd"], message: "Warranty end must be after start" }
);
export type DeviceFormValues = z.infer<typeof deviceFormSchema>;

/* ---------- Zod: catalog (lookup) forms ---------- */
export const departmentFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  manager: z.string().max(120).optional().or(z.literal("")),
  primaryLocation: z.string().max(120).optional().or(z.literal("")),
});
export type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

export const groupFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  icon: z.string().max(40).optional().or(z.literal("")),
  defaultInventoryCycleMonths: z.coerce.number().int().min(1).max(120),
});
export type GroupFormValues = z.infer<typeof groupFormSchema>;

export const manufacturerFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  supportContact: z.string().max(160).optional().or(z.literal("")),
});
export type ManufacturerFormValues = z.infer<typeof manufacturerFormSchema>;

/* ---------- Derived flags (mirror of the devices_with_flags SQL function) ---------- */
// Status is stored; condition is its own field. These are the only DERIVED bits.
// The warranty window is configurable (org_settings.warranty_expiring_days) — pass it
// in via opts so a settings change re-evaluates flags with no backfill. Defaults to 90.
export interface DeriveFlagsOptions {
  warrantyWindowDays?: number;
  now?: Date;
}
export function deriveFlags(
  d: Pick<Device, "status" | "warrantyEnd" | "lastCheckDate" | "inventoryCycleMonths">,
  opts: DeriveFlagsOptions = {}
): DeviceFlag[] {
  const { warrantyWindowDays = 90, now = new Date() } = opts;
  const flags: DeviceFlag[] = [];
  if (d.status === "retired") return flags; // no alerts on retired gear
  if (d.warrantyEnd) {
    const end = new Date(d.warrantyEnd);
    const window = new Date(now); window.setDate(window.getDate() + warrantyWindowDays);
    if (end >= now && end <= window) flags.push("warranty-expiring");
  }
  if (d.lastCheckDate) {
    const due = new Date(d.lastCheckDate);
    due.setMonth(due.getMonth() + d.inventoryCycleMonths);
    if (due < now) flags.push("inventory-overdue");
  }
  return flags;
}

/* ---------- Settings row types (mirror of migration 004) ---------- */
export interface OrgSettings {
  orgName: string;
  primarySite?: string | null;
  dateFormat: string;
  // write-time device defaults
  codePrefix: string;
  codeAutogenerate: boolean;
  defaultInventoryCycleMonths: number;
  // read-time thresholds
  conditionGoodPct: number;
  conditionFairPct: number;
  warrantyExpiringDays: number;
  // notifications (job config)
  notifyWarranty: boolean;
  notifyInventoryOverdue: boolean;
  notifyWeeklySummary: boolean;
  notifyNewDevice: boolean;
  // data & export
  exportFormat: "CSV" | "XLSX" | "PDF";
  deletedRetentionDays: number;
  updatedBy?: string | null;
  updatedAt: string;
}

export interface UserPreference {
  userId: string;
  theme: "light" | "dark" | "system";
  defaultDeviceView: "table" | "cards";
  monoCodes: boolean;
  updatedAt: string;
}

/* ---------- Members & access (mirror of migration 003) ---------- */
export const MEMBER_ROLES = ["it_admin", "manager", "viewer"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];
export const MEMBER_STATUSES = ["active", "invited", "disabled"] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

/* role enum → display label (UI shows these; DB stores the enum) */
export const ROLE_LABEL: Record<MemberRole, string> = {
  it_admin: "IT Admin",
  manager: "Manager",
  viewer: "Viewer",
};

export interface Member {
  id: string;
  name: string;
  email: string;                 // IT-managed @sioux.asia address
  role: MemberRole;
  status: MemberStatus;
  departmentId?: string | null;
  site?: string | null;
  phone?: string | null;
  reportsTo?: string | null;     // self-FK
  joinedAt?: string | null;      // "Member since"
  lastActiveAt?: string | null;  // drives "Last active"
  invitedBy?: string | null;
}

/* Capability matrix — DERIVED from role, never stored. The profile's
   "Permissions" card renders exactly this. */
export type Capability =
  | "view_inventory"
  | "manage_dept_devices"
  | "manage_all_devices"
  | "manage_catalogs"
  | "export_data"
  | "manage_members"
  | "manage_settings";

export const CAPABILITY_LABEL: Record<Capability, string> = {
  view_inventory: "View inventory",
  manage_dept_devices: "Manage devices in dept",
  manage_all_devices: "Manage all devices",
  manage_catalogs: "Manage catalogs",
  export_data: "Export data",
  manage_members: "Manage members",
  manage_settings: "Change workspace settings",
};

export const CAPABILITIES: Record<MemberRole, Record<Capability, boolean>> = {
  it_admin: {
    view_inventory: true, manage_dept_devices: true, manage_all_devices: true,
    manage_catalogs: true, export_data: true, manage_members: true, manage_settings: true,
  },
  manager: {
    view_inventory: true, manage_dept_devices: true, manage_all_devices: false,
    manage_catalogs: false, export_data: true, manage_members: false, manage_settings: false,
  },
  viewer: {
    view_inventory: true, manage_dept_devices: false, manage_all_devices: false,
    manage_catalogs: false, export_data: false, manage_members: false, manage_settings: false,
  },
};
export const can = (role: MemberRole, cap: Capability) => CAPABILITIES[role][cap];

/* role → badge tone (matches .badge-* in the theme) */
export const ROLE_TONE: Record<MemberRole, "primary" | "secondary" | "muted"> = {
  it_admin: "primary",
  manager: "secondary",
  viewer: "muted",
};

/* status → badge tone (matches .badge-* in the theme) */
export const STATUS_TONE: Record<DeviceStatus, "success" | "info" | "warning" | "muted"> = {
  "in-use": "success",
  "in-storage": "info",
  "in-repair": "warning",
  retired: "muted",
};

/* flag → label + lucide icon (chips render with tone "warning") */
export const FLAG_META: Record<DeviceFlag, { label: string; icon: string }> = {
  "warranty-expiring": { label: "Warranty expiring", icon: "shield-alert" },
  "inventory-overdue": { label: "Inventory overdue", icon: "calendar-clock" },
};

/* ---------- Activity log (mirror of migration 005) ---------- */
export type ActivityAction =
  | "device.created" | "device.updated" | "device.status_changed"
  | "device.deleted" | "device.restored"
  | "device.inventory_checked" | "device.allocated"
  | "member.invited" | "member.role_changed" | "member.removed"
  | "catalog.created" | "catalog.updated" | "catalog.deleted"
  | "settings.updated";

export interface Activity {
  id: string;
  actorId?: string | null;          // null = system / scheduled job
  action: ActivityAction;
  entityType: "device" | "member" | "department" | "group" | "manufacturer" | "settings";
  entityId?: string | null;
  entityLabel?: string | null;      // denormalized for display
  metadata: Record<string, unknown>; // e.g. { from: "in-storage", to: "in-repair" }
  createdAt: string;
}

/* action → lucide icon + a phrase builder for the timeline rows */
export const ACTIVITY_META: Record<ActivityAction, { icon: string; verb: string }> = {
  "device.created":           { icon: "plus",            verb: "registered" },
  "device.updated":           { icon: "pencil",          verb: "updated" },
  "device.status_changed":    { icon: "circle-dot",      verb: "changed status of" },
  "device.deleted":           { icon: "trash-2",         verb: "deleted" },
  "device.restored":          { icon: "rotate-ccw",      verb: "restored" },
  "device.inventory_checked": { icon: "clipboard-check", verb: "passed inventory check on" },
  "device.allocated":         { icon: "user-check",      verb: "allocated" },
  "member.invited":           { icon: "user-plus",       verb: "invited" },
  "member.role_changed":      { icon: "user-cog",        verb: "changed the role of" },
  "member.removed":           { icon: "user-minus",      verb: "removed" },
  "catalog.created":          { icon: "plus",            verb: "added catalog entry" },
  "catalog.updated":          { icon: "pencil",          verb: "updated catalog entry" },
  "catalog.deleted":          { icon: "trash-2",         verb: "removed catalog entry" },
  "settings.updated":         { icon: "settings",        verb: "updated settings" },
};
