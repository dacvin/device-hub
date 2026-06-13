/* =============================================================================
 * DeviceHub — Canonical domain types
 * -----------------------------------------------------------------------------
 * Hand-off target: Next.js (App Router) + shadcn/ui + Tailwind v4.
 *
 * These are the SHAPES the UI binds to. A backend already exists — wire these
 * to it. Where the mock seed data (reference_html/theme/data.js) and the mobile
 * mock (reference_html/mobile/mobile-screens.js) disagree, the DESKTOP model is
 * canonical; the mobile mock is older — see §"DIVERGENCE" at the bottom.
 *
 * VALIDATION NOTE (per hand-off brief): runtime validation (e.g. Zod) is
 * described as BEHAVIOR in JSDoc — `@validate` tags — not encoded as schemas
 * here. Translate each `@validate` line into a Zod refinement when you build
 * the forms. Field requiredness is also reflected by `?` optionality below.
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
 * NOTE the wire values are hyphen-free for storage/repair: `storage`, `repair`
 * (NOT `in-storage`/`in-repair`). The human label adds the "In ".
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
  /** lastCheck + (cycle months) is in the past — overdue for inventory. */
  InventoryOverdue = "inventory",
}

/** How the device entered the fleet. Lookup-backed (editable list). */
export type DeviceSource = "Purchased" | "Leased" | "Donated" | "Transferred";

/** Unit of measure a device is counted in. Lookup-backed (Units catalog). */
export type DeviceUnit = "Piece" | "Set" | "Box" | (string & {});

/** Access role. Drives the capability matrix (see §"ROLES & PERMISSIONS"). */
export enum MemberRole {
  /** Full access — manage every device, catalog & member. */
  Admin = "Admin",
  /** Manage and view devices in the inventory. Cannot manage members. */
  Member = "Member",
}

/** Account state of a member. */
export enum MemberStatus {
  Active = "active",
  /** Invited but has not yet accepted (no last-active, no join date). */
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
 *    device references it (enforced in the UI — see Groups/Units/Manufacturers
 *    page docs). Counts shown next to each row = number of devices referencing.
 * ───────────────────────────────────────────────────────────────────────── */

/** Device category. `name` is the join key used on Device.group. */
export interface Group {
  /** Display name AND foreign key (Device.group stores this string). Unique. */
  name: string;
  /** lucide icon name shown in the row and on device tiles. */
  icon: string;
  /** Default inventory cycle in MONTHS, pre-filled onto new devices of this group. */
  cycle: number;
}

/** Vendor. `name` is the join key used on Device.mfr. */
export interface Manufacturer {
  /** Display name AND foreign key (Device.mfr stores this string). Unique. */
  name: string;
  /** Support URL / contact (rendered monospace). Free text. */
  support: string;
}

/** Unit of measure. `name` is the join key used on Device.unit. */
export interface Unit {
  /** Display name AND foreign key (Device.unit stores this string). Unique. */
  name: string;
  /** Human description shown in the table; optional. */
  desc?: string;
}

/** The four lookup lists that populate the Create/Edit device selects. */
export interface Lookups {
  groups: string[];        // Group.name[]
  manufacturers: string[]; // Manufacturer.name[]
  units: string[];         // Unit.name[]
  sources: DeviceSource[];
}


/* ─────────────────────────────────────────────────────────────────────────
 * 3. DEVICE — the core entity
 * ───────────────────────────────────────────────────────────────────────── */

export interface Device {
  /**
   * Human-readable asset code, e.g. "DEV-2041-XPS". PRIMARY KEY used in all
   * row identity, URLs, selection sets, and delete operations.
   * @validate required · unique · pattern suggested DEV-####-XXX (auto-suggested from group)
   */
  code: string;

  /** Full device name, e.g. "Dell XPS 15 9530".  @validate required, 1–80 chars */
  name: string;

  /** FK → Group.name, e.g. "Laptop".  @validate required, must exist in Lookups.groups */
  group: string;

  /** FK → Manufacturer.name, e.g. "Dell".  @validate optional, must exist in Lookups.manufacturers */
  mfr: string;

  /** Model designation, e.g. "XPS 15 9530".  @validate optional free text */
  model: string;

  /** Serial number, rendered monospace, e.g. "5KQ8R2".  @validate optional, unique if present */
  sn: string;

  /**
   * Physical condition, integer 0–100 (%). Drives the condition bar/ring color:
   * ≥70 green, 40–69 amber, <40 red (see `conditionColor()` §5).
   * @validate 0 ≤ cond ≤ 100, integer. Defaults to 100 on create.
   */
  cond: number;

  /** Free-text location, e.g. "HCMC · Floor 4 · Desk E-12". (a.k.a. "Storage position" on forms) */
  loc: string;

  /** Quantity of identical items tracked under this one record. @validate integer ≥ 1, default 1 */
  qty: number;

  /** Lifecycle status. @validate required, one of DeviceStatus */
  status: DeviceStatus;

  /** FK → Unit.name, e.g. "Piece". @validate required, must exist in Lookups.units */
  unit: DeviceUnit;

  /** How it entered the fleet. @validate optional, one of Lookups.sources */
  source: DeviceSource;

  /** Import / acquisition date. ISO 8601 date string "YYYY-MM-DD". */
  imported: string;

  /** Date of the last inventory check. ISO date string. Used to derive InventoryOverdue. */
  lastCheck: string;

  /** Inventory cadence in MONTHS (defaulted from the device's Group.cycle). @validate integer ≥ 1 */
  cycle: number;

  /** Warranty start date. ISO date string. */
  wStart: string;

  /** Warranty end date. ISO date string. Used to derive WarrantyExpiring + "days remaining". */
  wEnd: string;

  /** Free-text spec line, e.g. "Intel i7-13700H · 32GB · 1TB SSD · RTX 4050". */
  spec: string;

  /**
   * Cover photo URL. OPTIONAL. When present the Device List "Cards" view and
   * the list thumbnail show the image; when absent they fall back to the
   * group's lucide icon on a mint tile. Additional photos exist in the upload
   * gallery but only the cover is surfaced in lists.
   */
  photo?: string;

  /**
   * Supporting documents (invoices, warranty cards, manuals). Captured by the
   * doc dropzone on Create/Edit. Not rendered in lists. Shape suggested below.
   */
  documents?: DeviceDocument[];

  /**
   * NOT part of the canonical desktop model. The desktop catalog is Groups/Units/Manufacturers —
   * there is no Departments catalog and Device has no department. (The Device-List Cards view was
   * updated to bind real fields — mfr/model/group/loc — instead of a phantom `dept`.) Only add this
   * if the backend genuinely has Departments; see the DIVERGENCE table at the bottom.
   */
  dept?: string;
}

export interface DeviceDocument {
  name: string;       // "dell-invoice-2023.pdf"
  size: number;       // bytes
  url?: string;       // download URL when persisted
}

/** A device photo in the upload gallery. First photo (index 0) is the cover. */
export interface DevicePhoto {
  name: string;
  src?: string;       // object URL while local; remote URL once stored
  isCover?: boolean;  // derived: index === 0
}


/* ─────────────────────────────────────────────────────────────────────────
 * 4. MEMBER — a person with access to DeviceHub
 *    Combined shape: list rows use the top fields; the profile page adds the
 *    lower "profile detail" fields. Email is the PRIMARY KEY and is IT-managed
 *    (immutable in-app).
 * ───────────────────────────────────────────────────────────────────────── */

export interface Member {
  /** Full name. @validate required */
  name: string;

  /** Work email. PRIMARY KEY. IT-managed — cannot be edited in-app.
   *  @validate required · must be @sioux.asia · unique */
  email: string;

  /** Access role. @validate required, one of MemberRole */
  role: MemberRole;

  /** Account state. @validate required, one of MemberStatus */
  status: MemberStatus;

  /** Human "last active" string for display, e.g. "Active now", "2 hours ago", "—". */
  last: string;

  /** True for the currently-signed-in user (renders the "You" pill; limits self-actions). */
  you?: boolean;

  // ── profile-detail fields (Member Profile page) ──
  /** Office, e.g. "HCMC" | "Hanoi". */
  site?: string;
  /** Phone, rendered monospace. "—" when unknown. */
  phone?: string;
  /** Manager's name, or "—". */
  manager?: string;
  /** Join date, ISO date string or "—" for invited members. */
  joined?: string;
}


/* ─────────────────────────────────────────────────────────────────────────
 * 5. DERIVED VALUES — pure functions, never stored. Implement on client or API.
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Compute the attention flags for a device as of `today`.
 * Rules (must match reference_html/theme/data.js):
 *   • retired devices → always [] (no alerts on decommissioned gear)
 *   • WarrantyExpiring → wEnd is within [today, today+90d] (not already expired)
 *   • InventoryOverdue → lastCheck + cycle months < today
 * Order is [warranty, inventory] when both apply.
 */
export declare function deviceFlags(device: Device, today?: Date): DeviceFlag[];

/** ≥70 → green-500, 40–69 → amber (oklch(0.78 0.13 75)), <40 → destructive red. */
export declare function conditionColor(cond: number): string;

/** Whole days between wEnd and today; negative ⇒ expired. Drives "N days remaining". */
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
  group: string;      // "" = all
  status: "" | DeviceStatus;
  mfr: string;        // "" = all
  flag: "" | DeviceFlag;
  q: string;          // free-text search over code+name+sn+model
}


/* =============================================================================
 * DIVERGENCE — RESOLVED. The mobile mock has been reconciled to this canonical
 * desktop model; the table below records the mapping that was applied.
 * -----------------------------------------------------------------------------
 *  Concept    | Canonical (desktop AND mobile) | Mobile mock — was (now removed)
 *  -----------|--------------------------------|------------------------------------
 *  Roles      | Admin, Member                  | IT Admin, Manager, Viewer
 *  Catalogs   | Groups, Units, Manufacturers   | Departments, Groups, Manufacturers
 *  Status key | "storage", "repair"            | "in-storage", "in-repair"
 *  Member     | site (no dept)                 | dept
 *
 *  Both surfaces now bind these same types. If the backend genuinely needs
 *  Departments or a 3-tier role model, add it deliberately in ONE place and
 *  extend both surfaces — don't reintroduce the split.
 * =========================================================================== */
