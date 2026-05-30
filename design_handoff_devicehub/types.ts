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

/* ---------- Derived flags (mirror of the device_with_flags SQL view) ---------- */
// Status is stored; condition is its own field. These are the only DERIVED bits.
export function deriveFlags(
  d: Pick<Device, "status" | "warrantyEnd" | "lastCheckDate" | "inventoryCycleMonths">,
  now: Date = new Date()
): DeviceFlag[] {
  const flags: DeviceFlag[] = [];
  if (d.status === "retired") return flags; // no alerts on retired gear
  if (d.warrantyEnd) {
    const end = new Date(d.warrantyEnd);
    const in90 = new Date(now); in90.setDate(in90.getDate() + 90);
    if (end >= now && end <= in90) flags.push("warranty-expiring");
  }
  if (d.lastCheckDate) {
    const due = new Date(d.lastCheckDate);
    due.setMonth(due.getMonth() + d.inventoryCycleMonths);
    if (due < now) flags.push("inventory-overdue");
  }
  return flags;
}

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
