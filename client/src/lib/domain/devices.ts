// DeviceHub domain layer.
//
// Ports the handoff's design_handoff_devicehub/types.ts on top of the
// generated Supabase row types. The DB is source of truth; this file owns:
//   - enum tuples (matched 1:1 with the Postgres enums)
//   - camelCase row interfaces for the app layer
//   - Zod schemas for the Create/Edit + catalog forms
//   - deriveFlags() mirror of the device_with_flags view
//   - STATUS_TONE / FLAG_META theme-class maps
//   - snake_case row -> camelCase domain mappers

import { z } from "zod";
import type { Database, Tables } from "@/types/database.types";

/* ---------- Enums ---------- */
export const UNITS = ["piece", "set", "box"] as const;
export type Unit = (typeof UNITS)[number];

export const SOURCES = ["Purchased", "Leased", "Donated", "Transferred"] as const;
export type DeviceSource = (typeof SOURCES)[number];

export const DEVICE_STATUSES = ["in-use", "in-storage", "in-repair", "retired"] as const;
export type DeviceStatus = (typeof DEVICE_STATUSES)[number];

export const DEVICE_FLAGS = ["warranty-expiring", "inventory-overdue"] as const;
export type DeviceFlag = (typeof DEVICE_FLAGS)[number];

/* ---------- Row types (camelCase app layer) ---------- */
export interface Department {
  id: string;
  name: string;
  manager: string | null;
  primaryLocation: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceGroup {
  id: string;
  name: string;
  icon: string | null;
  defaultInventoryCycleMonths: number;
  createdAt: string;
  updatedAt: string;
}

export interface Manufacturer {
  id: string;
  name: string;
  supportContact: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DevicePhoto {
  id: string;
  deviceId: string;
  url: string;
  fileName: string | null;
  sizeBytes: number | null;
  sortOrder: number;
  createdAt: string;
}

export interface DeviceDocument {
  id: string;
  deviceId: string;
  url: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
}

export interface Device {
  id: string;
  code: string;
  name: string;
  groupId: string;
  departmentId: string;
  manufacturerId: string | null;
  model: string | null;
  serialNumber: string | null;
  specifications: string | null;
  notes: string | null;
  condition: number;
  location: string | null;
  quantity: number;
  unit: Unit;
  source: DeviceSource | null;
  status: DeviceStatus;
  importDate: string | null;
  lastCheckDate: string | null;
  inventoryCycleMonths: number;
  warrantyStart: string | null;
  warrantyEnd: string | null;
  coverPhotoId: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceWithFlags extends Device {
  flags: DeviceFlag[];
}

/* ---------- Zod: Create / Edit device ---------- */
export const deviceFormSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(120),
    code: z
      .string()
      .min(1, "Code is required")
      .regex(/^DEV-[A-Z0-9-]+$/i, "Use the DEV-XXXX-XXX format"),
    groupId: z.string().uuid("Choose a group"),
    departmentId: z.string().uuid("Choose a department"),
    manufacturerId: z.string().uuid().nullable().optional(),
    model: z.string().max(120).optional().or(z.literal("")),
    serialNumber: z.string().max(120).optional().or(z.literal("")),
    specifications: z.string().max(2000).optional().or(z.literal("")),
    notes: z.string().max(2000).optional().or(z.literal("")),
    condition: z.number().int().min(0).max(100),
    location: z.string().max(200).optional().or(z.literal("")),
    quantity: z.number().int().min(1, "At least 1"),
    unit: z.enum(UNITS),
    source: z.enum(SOURCES).nullable().optional(),
    status: z.enum(DEVICE_STATUSES),
    importDate: z.string().nullable().optional(),
    lastCheckDate: z.string().nullable().optional(),
    inventoryCycleMonths: z.number().int().min(1).max(120),
    warrantyStart: z.string().nullable().optional(),
    warrantyEnd: z.string().nullable().optional(),
  })
  .refine(
    (d) =>
      !d.warrantyStart || !d.warrantyEnd || new Date(d.warrantyEnd) >= new Date(d.warrantyStart),
    { path: ["warrantyEnd"], message: "Warranty end must be after start" }
  );
export type DeviceFormValues = z.infer<typeof deviceFormSchema>;

/* ---------- Zod: catalog forms ---------- */
export const departmentFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  manager: z.string().max(120).optional().or(z.literal("")),
  primaryLocation: z.string().max(120).optional().or(z.literal("")),
});
export type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

export const groupFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  icon: z.string().max(40).optional().or(z.literal("")),
  defaultInventoryCycleMonths: z.number().int().min(1).max(120),
});
export type GroupFormValues = z.infer<typeof groupFormSchema>;

export const manufacturerFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  supportContact: z.string().max(160).optional().or(z.literal("")),
});
export type ManufacturerFormValues = z.infer<typeof manufacturerFormSchema>;

/* ---------- Derived flags (mirror of device_with_flags) ---------- */
export function deriveFlags(
  d: Pick<Device, "status" | "warrantyEnd" | "lastCheckDate" | "inventoryCycleMonths">,
  now: Date = new Date()
): DeviceFlag[] {
  const flags: DeviceFlag[] = [];
  if (d.status === "retired") return flags;
  if (d.warrantyEnd) {
    const end = new Date(d.warrantyEnd);
    const in90 = new Date(now);
    in90.setDate(in90.getDate() + 90);
    if (end >= now && end <= in90) flags.push("warranty-expiring");
  }
  if (d.lastCheckDate) {
    const due = new Date(d.lastCheckDate);
    due.setMonth(due.getMonth() + d.inventoryCycleMonths);
    if (due < now) flags.push("inventory-overdue");
  }
  return flags;
}

/* ---------- Theme-class maps ---------- */
export const STATUS_TONE: Record<DeviceStatus, "success" | "info" | "warning" | "muted"> = {
  "in-use": "success",
  "in-storage": "info",
  "in-repair": "warning",
  retired: "muted",
};

export const FLAG_META: Record<DeviceFlag, { icon: string }> = {
  "warranty-expiring": { icon: "shield-alert" },
  "inventory-overdue": { icon: "calendar-clock" },
};

/* ---------- Row -> domain mappers ---------- */
type DeviceRow = Tables<"device">;
type DeviceWithFlagsRow = Database["public"]["Views"]["device_with_flags"]["Row"];
type DepartmentRow = Tables<"department">;
type DeviceGroupRow = Tables<"device_group">;
type ManufacturerRow = Tables<"manufacturer">;
type DevicePhotoRow = Tables<"device_photo">;
type DeviceDocumentRow = Tables<"device_document">;

export function mapDepartmentRow(r: DepartmentRow): Department {
  return {
    id: r.id,
    name: r.name,
    manager: r.manager,
    primaryLocation: r.primary_location,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function mapGroupRow(r: DeviceGroupRow): DeviceGroup {
  return {
    id: r.id,
    name: r.name,
    icon: r.icon,
    defaultInventoryCycleMonths: r.default_inventory_cycle_months,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function mapManufacturerRow(r: ManufacturerRow): Manufacturer {
  return {
    id: r.id,
    name: r.name,
    supportContact: r.support_contact,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function mapPhotoRow(r: DevicePhotoRow): DevicePhoto {
  return {
    id: r.id,
    deviceId: r.device_id,
    url: r.url,
    fileName: r.file_name,
    sizeBytes: r.size_bytes,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
  };
}

export function mapDocumentRow(r: DeviceDocumentRow): DeviceDocument {
  return {
    id: r.id,
    deviceId: r.device_id,
    url: r.url,
    fileName: r.file_name,
    mimeType: r.mime_type,
    sizeBytes: r.size_bytes,
    createdAt: r.created_at,
  };
}

export function mapDeviceRow(r: DeviceRow): Device {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    groupId: r.group_id,
    departmentId: r.department_id,
    manufacturerId: r.manufacturer_id,
    model: r.model,
    serialNumber: r.serial_number,
    specifications: r.specifications,
    notes: r.notes,
    condition: r.condition,
    location: r.location,
    quantity: r.quantity,
    unit: r.unit as Unit,
    source: (r.source ?? null) as DeviceSource | null,
    status: r.status as DeviceStatus,
    importDate: r.import_date,
    lastCheckDate: r.last_check_date,
    inventoryCycleMonths: r.inventory_cycle_months,
    warrantyStart: r.warranty_start,
    warrantyEnd: r.warranty_end,
    coverPhotoId: r.cover_photo_id,
    deletedAt: r.deleted_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// View rows have all nullable columns; assert presence on the not-null fields.
export function mapDeviceWithFlagsRow(r: DeviceWithFlagsRow): DeviceWithFlags {
  const flags: DeviceFlag[] = [];
  if (r.flag_warranty_expiring) flags.push("warranty-expiring");
  if (r.flag_inventory_overdue) flags.push("inventory-overdue");
  return {
    id: r.id!,
    code: r.code!,
    name: r.name!,
    groupId: r.group_id!,
    departmentId: r.department_id!,
    manufacturerId: r.manufacturer_id,
    model: r.model,
    serialNumber: r.serial_number,
    specifications: r.specifications,
    notes: r.notes,
    condition: r.condition!,
    location: r.location,
    quantity: r.quantity!,
    unit: r.unit as Unit,
    source: (r.source ?? null) as DeviceSource | null,
    status: r.status as DeviceStatus,
    importDate: r.import_date,
    lastCheckDate: r.last_check_date,
    inventoryCycleMonths: r.inventory_cycle_months!,
    warrantyStart: r.warranty_start,
    warrantyEnd: r.warranty_end,
    coverPhotoId: r.cover_photo_id,
    deletedAt: r.deleted_at,
    createdAt: r.created_at!,
    updatedAt: r.updated_at!,
    flags,
  };
}

/* ---------- Form -> DB insert/update mappers ---------- */
export function deviceFormToInsert(v: DeviceFormValues): Database["public"]["Tables"]["device"]["Insert"] {
  const blank = (s: string | null | undefined) => (s && s.length ? s : null);
  return {
    code: v.code,
    name: v.name,
    group_id: v.groupId,
    department_id: v.departmentId,
    manufacturer_id: v.manufacturerId ?? null,
    model: blank(v.model),
    serial_number: blank(v.serialNumber),
    specifications: blank(v.specifications),
    notes: blank(v.notes),
    condition: v.condition,
    location: blank(v.location),
    quantity: v.quantity,
    unit: v.unit,
    source: v.source ?? null,
    status: v.status,
    import_date: blank(v.importDate),
    last_check_date: blank(v.lastCheckDate),
    inventory_cycle_months: v.inventoryCycleMonths,
    warranty_start: blank(v.warrantyStart),
    warranty_end: blank(v.warrantyEnd),
  };
}

/* ---------- Misc helpers ---------- */
export function conditionTone(c: number): "success" | "warning" | "danger" {
  if (c >= 70) return "success";
  if (c >= 40) return "warning";
  return "danger";
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function fileTypeIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["pdf", "txt", "md", "doc", "docx"].includes(ext)) return "file-text";
  if (["xls", "xlsx", "csv"].includes(ext)) return "file-spreadsheet";
  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) return "file-image";
  return "file";
}
