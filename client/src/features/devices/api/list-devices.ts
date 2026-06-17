import { createClient } from "@/lib/supabase/client";
import {
  DEVICE_SELECT,
  mapDeviceRow,
  type Device,
  type DeviceFlag,
  type DeviceStatus,
} from "@/lib/domain/devices";

export interface DeviceListFilters {
  q?: string;
  groupId?: string;
  status?: DeviceStatus | "";
  manufacturerId?: string;
  flag?: DeviceFlag | "";
}

export interface DeviceListResult {
  rows: Device[];
  totalCount: number;
  filteredCount: number;
}

export async function listDevices(
  filters: DeviceListFilters,
): Promise<DeviceListResult> {
  const supabase = createClient();

  const [{ data, error }, totalQ] = await Promise.all([
    supabase
      .from("devices")
      .select(DEVICE_SELECT)
      .is("deleted_at", null)
      .order("code"),
    supabase
      .from("devices")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),
  ]);

  if (error) throw error;
  if (totalQ.error) throw totalQ.error;

  const today = new Date();
  const rows = (data ?? []).map((r) => mapDeviceRow(r, today));

  const filtered = rows.filter((r) => {
    if (filters.groupId && r.groupId !== filters.groupId) return false;
    if (filters.status && r.status !== filters.status) return false;
    if (filters.manufacturerId && r.manufacturerId !== filters.manufacturerId)
      return false;
    if (filters.flag && !r.flags.includes(filters.flag)) return false;
    if (filters.q) {
      const q = filters.q.toLowerCase();
      const hay = [r.code, r.name, r.serialNumber ?? "", r.model ?? ""]
        .join("\n")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return {
    rows: filtered,
    totalCount: totalQ.count ?? rows.length,
    filteredCount: filtered.length,
  };
}
