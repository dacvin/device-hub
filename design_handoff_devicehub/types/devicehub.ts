/* =============================================================================
 * DeviceHub — Canonical domain types
 * -----------------------------------------------------------------------------
 * Hand-off target: Next.js (App Router) + shadcn/ui + Tailwind v4.
 *
 * These are the SHAPES the UI binds to, written to mirror the Supabase schema
 * (see supabase/schemas/*.sql). Field names use camelCase here; their DB column
 * names appear in the JSDoc on each field.
 *
 * Catalog joins use uuid foreign keys (groupId, unitId, manufacturerId). The UI
 * is responsible for joining against the Groups / Units / Manufacturers catalogs
 * to render human names.
 *
 * VALIDATION NOTE: runtime validation (e.g. Zod) is described as BEHAVIOR in
 * JSDoc — `@validate` tags — not encoded as schemas here. Translate each
 * `@validate` line into a Zod refinement when you build the forms. Field
 * requiredness is also reflected by `?` optionality below.
 * =========================================================================== */


/* ─────────────────────────────────────────────────────────────────────────
 * 1. ENUMS & UNIONS
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Lifecycle state of a device. A device is in EXACTLY ONE status at a time
 * (mutually exclusive). Set explicitly by an Admin via actions
 * (assign → "in-use", send to service → "repair", decommission → "retired").
 * Stored on the device record.
 *
 * Wire values match `public.device_status` enum in Postgres.
 */
export enum DeviceStatus {
  InUse = "in-use",
  Storage = "storage",
  Repair = "repair",
  Retired = "retired",
}

/**
 * Attention flags. DERIVED at read time from dates — never stored. A device
 * can carry zero, one, or several simultaneously, independent of its status.
 * Retired devices never carry flags. See `deviceFlags()` in §5.
 */
export enum DeviceFlag {
  /** Warranty ends within the next 90 days (and has not already expired). */
  WarrantyExpiring = "warranty",
  /** lastCheckDate + (cycle months) is in the past — overdue for inventory. */
  InventoryOverdue = "inventory",
}

/** How the device entered the fleet. Wire values match `public.device_source`. */
export type DeviceSource = "Purchased" | "Leased" | "Donated" | "Transferred";

/** Access role. Wire values match `public.user_role` (lowercase). */
export enum MemberRole {
  /** Full access — manage every device, catalog & member. */
  Admin = "admin",
  /** Manage and view devices in the inventory. Cannot manage members. */
  Member = "member",
}

/** Account state of a member. Wire values match `public.user_status`. */
export enum MemberStatus {
  Active = "active",
  /** Invited but has not yet accepted (no joinedAt, no lastActiveAt). */
  Invited = "invited",
  /** Access revoked; can be re-activated. */
  Deactivated = "deactivated",
}

/**
 * Visual tone for badges/pills. Maps 1:1 to the `.badge-{tone}` CSS classes
 * and to the `tone` field on STATUS/FLAGS. Not a domain concept — a
 * presentation token — but listed here because status/flag records carry it.
 */
export type Tone =
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "muted"
  | "primary"
  | "secondary"
  | "outline";


/* ─────────────────────────────────────────────────────────────────────────
 * 2. LOOKUP / CATALOG ENTITIES
 *    Each is a small editable table. A catalog row CANNOT be deleted while any
 *    device references it (UI enforces — see Groups/Units/Manufacturers page
 *    docs). Counts shown next to each row = number of devices referencing.
 * ───────────────────────────────────────────────────────────────────────── */

/** Device category. Table: `public.groups`. */
export interface Group {
  /** DB: `id`. UUID primary key. */
  id: string;
  /** DB: `name`. Display name, unique. */
  name: string;
  /** DB: `icon`. lucide icon name shown in the row and on device tiles. */
  icon: string;
  /** DB: `default_inventory_cycle_months`. Pre-filled onto new devices of this group. */
  defaultInventoryCycleMonths: number;
}

/** Vendor. Table: `public.manufacturers`. */
export interface Manufacturer {
  /** DB: `id`. UUID primary key. */
  id: string;
  /** DB: `name`. Display name, unique. */
  name: string;
  /** DB: `support_contact`. Support URL / contact (rendered monospace). */
  supportContact: string;
}

/** Unit of measure. Table: `public.units`. */
export interface Unit {
  /** DB: `id`. UUID primary key. */
  id: string;
  /** DB: `name`. Display name, unique. */
  name: string;
  /** DB: `abbreviation`. Short form (e.g. "pc", "set"). Optional. */
  abbreviation?: string;
  /** DB: `description`. Human description shown in the table. Optional. */
  description?: string;
}

/** The four lookup lists that populate the Create/Edit device selects. */
export interface Lookups {
  groups: Group[];
  manufacturers: Manufacturer[];
  units: Unit[];
  sources: DeviceSource[];
}


/* ─────────────────────────────────────────────────────────────────────────
 * 3. DEVICE — the core entity. Table: `public.devices`.
 * ───────────────────────────────────────────────────────────────────────── */

export interface Device {
  /** DB: `id`. UUID primary key. */
  id: string;

  /**
   * DB: `code`. Human-readable asset code, e.g. "DEV-2041-XPS". Unique;
   * used in URLs and surface displays.
   * @validate required · unique · pattern suggested DEV-####-XXX
   */
  code: string;

  /** DB: `name`. Full device name, e.g. "Dell XPS 15 9530". @validate required, 1–80 chars */
  name: string;

  /** DB: `group_id`. FK → Group.id. @validate required */
  groupId: string;

  /** DB: `unit_id`. FK → Unit.id. @validate required */
  unitId: string;

  /** DB: `manufacturer_id`. FK → Manufacturer.id. @validate required */
  manufacturerId: string;

  /** DB: `model`. Model designation, e.g. "XPS 15 9530". @validate optional free text */
  model: string;

  /** DB: `serial_number`. Rendered monospace, e.g. "5KQ8R2". @validate optional, unique if present */
  serialNumber: string;

  /** DB: `specifications`. Free-text spec line, e.g. "Intel i7-13700H · 32GB · 1TB SSD · RTX 4050". */
  specifications: string;

  /** DB: `notes`. Free-text notes shown on the Device Details page. Optional. */
  notes?: string;

  /**
   * DB: `condition`. Integer 0–100 (%). Drives the condition bar/ring color:
   * ≥70 green, 40–69 amber, <40 red (see `conditionColor()` §5).
   * @validate 0 ≤ condition ≤ 100, integer. Defaults to 100 on create.
   */
  condition: number;

  /** DB: `location`. Free-text location, e.g. "HCMC · Floor 4 · Desk E-12". */
  location: string;

  /** DB: `quantity`. Identical items tracked under this one record. @validate integer ≥ 1, default 1 */
  quantity: number;

  /** DB: `status`. Lifecycle status. @validate required, one of DeviceStatus */
  status: DeviceStatus;

  /** DB: `source`. How it entered the fleet. @validate optional, one of DeviceSource */
  source: DeviceSource;

  /** DB: `import_date`. Import / acquisition date. ISO 8601 date string "YYYY-MM-DD". */
  importDate: string;

  /** DB: `last_check_date`. Last inventory check. ISO date string. Drives InventoryOverdue. */
  lastCheckDate: string;

  /**
   * DB: `inventory_cycle_months`. Inventory cadence in months
   * (defaulted from the device's Group.defaultInventoryCycleMonths).
   * @validate integer in [1, 120]
   */
  inventoryCycleMonths: number;

  /** DB: `warranty_start`. ISO date string. */
  warrantyStart: string;

  /** DB: `warranty_end`. ISO date string. Drives WarrantyExpiring + "days remaining". */
  warrantyEnd: string;

  /** DB: `photos` jsonb[]. Cover = entry with `sortOrder === 0`. */
  photos: DevicePhoto[];

  /** DB: `documents` jsonb[]. Invoices, warranty cards, manuals. */
  documents: DeviceDocument[];

  /** DB: `created_at`. ISO timestamp. */
  createdAt: string;
  /** DB: `updated_at`. ISO timestamp. */
  updatedAt: string;
  /** DB: `deleted_at`. ISO timestamp or null. Soft-delete marker. */
  deletedAt: string | null;
}

/**
 * Entry shape for `devices.photos` and `devices.documents` JSONB arrays.
 * Photos: cover = entry with `sortOrder === 0`.
 */
export interface DeviceFileEntry {
  /** In-bucket key for device-photos / device-documents Storage bucket. */
  path: string;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  /** 0 = cover (photos); arbitrary ordering otherwise. */
  sortOrder: number;
  /** ISO timestamp when uploaded. */
  uploadedAt: string;
}

export type DevicePhoto = DeviceFileEntry;
export type DeviceDocument = DeviceFileEntry;


/* ─────────────────────────────────────────────────────────────────────────
 * 4. MEMBER — a person with access to DeviceHub. Table: `public.users`.
 *    Combined shape: list rows use the top fields; the profile page adds the
 *    lower "profile detail" fields. Email is unique and IT-managed
 *    (immutable in-app).
 * ───────────────────────────────────────────────────────────────────────── */

export interface Member {
  /** DB: `id`. UUID primary key. */
  id: string;

  /**
   * DB: `auth_user_id`. Linked Supabase auth user. Null until the invitee
   * accepts and signs in.
   */
  authUserId: string | null;

  /** DB: `name`. Full name. @validate required */
  name: string;

  /**
   * DB: `email`. Work email. Unique. IT-managed — cannot be edited in-app.
   * @validate required · must be @gmail.com · unique
   */
  email: string;

  /** DB: `phone`. Rendered monospace. Null/empty when unknown. */
  phone: string | null;

  /** DB: `role`. @validate required, one of MemberRole */
  role: MemberRole;

  /** DB: `status`. @validate required, one of MemberStatus */
  status: MemberStatus;

  /** DB: `joined_at`. ISO date string or null (invited members). */
  joinedAt: string | null;

  /** DB: `last_active_at`. ISO timestamp or null. Rendered as humanized "N hours ago". */
  lastActiveAt: string | null;

  /** DB: `invited_by`. UUID of the member who issued the invite, or null. */
  invitedBy: string | null;

  /** DB: `created_at`. */
  createdAt: string;
  /** DB: `updated_at`. */
  updatedAt: string;
  /** DB: `deleted_at`. Soft-delete marker. */
  deletedAt: string | null;

  /**
   * Derived (not in DB): true for the currently-signed-in user. Renders the
   * "You" pill and limits self-actions.
   */
  you?: boolean;
}


/* ─────────────────────────────────────────────────────────────────────────
 * 5. DERIVED VALUES — pure functions, never stored. Implement on client or API.
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Compute the attention flags for a device as of `today`.
 * Rules (must match reference_html/theme/data.js):
 *   • retired devices → always [] (no alerts on decommissioned gear)
 *   • WarrantyExpiring → warrantyEnd is within [today, today+90d] (not already expired)
 *   • InventoryOverdue → lastCheckDate + inventoryCycleMonths < today
 * Order is [warranty, inventory] when both apply.
 */
export declare function deviceFlags(device: Device, today?: Date): DeviceFlag[];

/** ≥70 → green-500, 40–69 → amber (oklch(0.78 0.13 75)), <40 → destructive red. */
export declare function conditionColor(condition: number): string;

/** Whole days between warrantyEnd and today; negative ⇒ expired. Drives "N days remaining". */
export declare function warrantyDaysRemaining(device: Device, today?: Date): number;


/* ─────────────────────────────────────────────────────────────────────────
 * 6. STATUS / FLAG METADATA (presentation maps used across every screen)
 * ───────────────────────────────────────────────────────────────────────── */

export interface StatusMeta { label: string; tone: Tone; }
export interface FlagMeta { label: string; icon: string; tone: Tone; }

/** label + tone for each lifecycle status (drives DH.statusBadge). */
export const STATUS_META: Record<DeviceStatus, StatusMeta> = {
  [DeviceStatus.InUse]:   { label: "In use",     tone: "success" },
  [DeviceStatus.Storage]: { label: "In storage", tone: "info" },
  [DeviceStatus.Repair]:  { label: "In repair",  tone: "warning" },
  [DeviceStatus.Retired]: { label: "Retired",    tone: "muted" },
};

/** label + lucide icon + tone for each derived flag (drives DH.flagChips). */
export const FLAG_META: Record<DeviceFlag, FlagMeta> = {
  [DeviceFlag.WarrantyExpiring]: { label: "Warranty expiring", icon: "shield-alert",   tone: "warning" },
  [DeviceFlag.InventoryOverdue]: { label: "Inventory overdue", icon: "calendar-clock", tone: "warning" },
};

/** Role → badge variant + lucide icon + one-line description (Members page). */
export const ROLE_META: Record<MemberRole, { icon: string; badge: `badge-${Tone}`; desc: string }> = {
  [MemberRole.Admin]:  { icon: "shield-check", badge: "badge-primary",   desc: "Full access — manage every device, catalog & member." },
  [MemberRole.Member]: { icon: "user",         badge: "badge-secondary", desc: "Manage and view devices in the inventory." },
};


/* ─────────────────────────────────────────────────────────────────────────
 * 7. UI HELPER SHAPES (toast / confirm / bulk) — from theme/states.js & shell.js
 *    Recreate with shadcn: Toast→sonner, Confirm→AlertDialog, Popover→DropdownMenu.
 * ───────────────────────────────────────────────────────────────────────── */

export interface ToastOptions {
  type?: "success" | "error" | "info"; // default "success"
  desc?: string;
  duration?: number;                     // ms, default 4000
}

export interface ConfirmOptions {
  title: string;
  desc?: string;
  confirmLabel?: string;                 // default "Confirm"
  cancelLabel?: string;                  // default "Cancel"
  icon?: string;                         // lucide name, default "triangle-alert"
  /** "danger" → red confirm button (destructive); "warn" → primary button. */
  tone?: "danger" | "warn";
  onConfirm: () => void;
}

/** Filters held in Device List state (all empty = show everything). */
export interface DeviceListFilters {
  /** "" = all; otherwise a Group.id (uuid). */
  groupId: string;
  status: "" | DeviceStatus;
  /** "" = all; otherwise a Manufacturer.id (uuid). */
  manufacturerId: string;
  flag: "" | DeviceFlag;
  /** Free-text search over code + name + serialNumber + model. */
  q: string;
}
