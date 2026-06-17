import type { Database } from "@/types/database.types";

export type DeviceRow = Database["public"]["Tables"]["devices"]["Row"];
export type DeviceStatus = Database["public"]["Enums"]["device_status"];
export type DeviceSource = Database["public"]["Enums"]["device_source"];

export const DEVICE_STATUSES: readonly DeviceStatus[] = [
  "in-use",
  "storage",
  "repair",
  "retired",
] as const;

export type Tone = "success" | "info" | "warning" | "danger" | "muted";

export interface StatusMeta {
  label: string;
  tone: Tone;
}

export const STATUS_META: Record<DeviceStatus, StatusMeta> = {
  "in-use": { label: "In use", tone: "success" },
  storage: { label: "In storage", tone: "info" },
  repair: { label: "In repair", tone: "warning" },
  retired: { label: "Retired", tone: "muted" },
};

/** Inline color stops used by the Overview lifecycle bar + legend swatch. */
export const STATUS_COLOR: Record<DeviceStatus, string> = {
  "in-use": "var(--green-500)",
  storage: "oklch(0.70 0.10 230)",
  repair: "oklch(0.78 0.13 75)",
  retired: "var(--muted-foreground)",
};

export type DeviceFlag = "warranty" | "inventory";

export interface FlagMeta {
  label: string;
  icon: string;
  tone: Tone;
}

export const FLAG_META: Record<DeviceFlag, FlagMeta> = {
  warranty: { label: "Warranty expiring", icon: "shield-alert", tone: "warning" },
  inventory: { label: "Inventory overdue", icon: "calendar-clock", tone: "warning" },
};

export interface DevicePhoto {
  path: string;
  file_name?: string;
  size_bytes?: number;
  mime_type?: string;
  sort_order: number;
  uploaded_at?: string;
}

export interface Device {
  id: string;
  code: string;
  name: string;
  groupId: string;
  groupName: string;
  groupIcon: string | null;
  manufacturerId: string | null;
  manufacturerName: string | null;
  model: string | null;
  serialNumber: string | null;
  specifications: string | null;
  notes: string | null;
  condition: number;
  location: string | null;
  quantity: number;
  status: DeviceStatus;
  source: DeviceSource | null;
  importDate: string | null;
  lastCheckDate: string | null;
  inventoryCycleMonths: number;
  warrantyStart: string | null;
  warrantyEnd: string | null;
  photos: DevicePhoto[];
  documents: DevicePhoto[];
  unitId: string;
  unitName: string;
  createdAt: string;
  updatedAt: string;
  flags: DeviceFlag[];
}

interface DeviceJoinRow extends DeviceRow {
  group: { name: string; icon: string | null } | null;
  unit: { name: string } | null;
  manufacturer: { name: string } | null;
}

export function mapDeviceRow(row: unknown, today: Date = new Date()): Device {
  const r = row as DeviceJoinRow;
  const photos = (Array.isArray(r.photos) ? (r.photos as unknown as DevicePhoto[]) : []) ?? [];
  const documents = (Array.isArray(r.documents) ? (r.documents as unknown as DevicePhoto[]) : []) ?? [];
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    groupId: r.group_id,
    groupName: r.group?.name ?? "—",
    groupIcon: r.group?.icon ?? null,
    manufacturerId: r.manufacturer_id ?? null,
    manufacturerName: r.manufacturer?.name ?? null,
    model: r.model,
    serialNumber: r.serial_number,
    specifications: r.specifications,
    notes: r.notes,
    condition: r.condition,
    location: r.location,
    quantity: r.quantity,
    status: r.status,
    source: r.source,
    importDate: r.import_date,
    lastCheckDate: r.last_check_date,
    inventoryCycleMonths: r.inventory_cycle_months,
    warrantyStart: r.warranty_start,
    warrantyEnd: r.warranty_end,
    photos: photos.sort((a, b) => a.sort_order - b.sort_order),
    documents,
    unitId: r.unit_id,
    unitName: r.unit?.name ?? "",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    flags: deviceFlags(
      {
        status: r.status,
        warranty_end: r.warranty_end,
        last_check_date: r.last_check_date,
        inventory_cycle_months: r.inventory_cycle_months,
      },
      today,
    ),
  };
}

export const DEVICE_SELECT = `
  *,
  group:group_id(name, icon),
  unit:unit_id(name),
  manufacturer:manufacturer_id(name)
`;

const MS_PER_DAY = 86_400_000;

function parseISODate(s: string): Date {
  return new Date(s + "T00:00:00Z");
}

function addMonths(d: Date, months: number): Date {
  const result = new Date(d);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

export function deviceFlags(
  device: {
    status: DeviceStatus;
    warranty_end: string | null;
    last_check_date: string | null;
    inventory_cycle_months: number;
  },
  today: Date = new Date(),
): DeviceFlag[] {
  if (device.status === "retired") return [];
  const flags: DeviceFlag[] = [];

  if (device.warranty_end) {
    const wEnd = parseISODate(device.warranty_end);
    const days = Math.floor((wEnd.getTime() - today.getTime()) / MS_PER_DAY);
    if (days >= 0 && days <= 90) flags.push("warranty");
  }

  if (device.last_check_date && device.inventory_cycle_months) {
    const next = addMonths(parseISODate(device.last_check_date), device.inventory_cycle_months);
    if (next.getTime() < today.getTime()) flags.push("inventory");
  }

  return flags;
}

export function conditionColor(condition: number): string {
  if (condition >= 70) return "var(--green-500)";
  if (condition >= 40) return "oklch(0.78 0.13 75)";
  return "var(--destructive)";
}

export function warrantyDaysRemaining(
  device: { warranty_end: string | null },
  today: Date = new Date(),
): number | null {
  if (!device.warranty_end) return null;
  const wEnd = parseISODate(device.warranty_end);
  return Math.floor((wEnd.getTime() - today.getTime()) / MS_PER_DAY);
}

export const GROUP_ICON: Record<string, string> = {
  Laptop: "laptop",
  Desktop: "monitor",
  Monitor: "monitor",
  Printer: "printer",
  Network: "network",
  Server: "server",
  Mobile: "smartphone",
  Peripheral: "webcam",
};

export function iconForGroup(name: string | null | undefined): string {
  if (!name) return "hard-drive";
  return GROUP_ICON[name] ?? "hard-drive";
}
