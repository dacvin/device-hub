import { createClient } from "@/lib/supabase/client";
import { getOrgSettings } from "@/features/settings/api/get-org-settings";
import { escapePostgrestFilter } from "@/lib/queries/_filter";
import { type DeviceFlag, type DeviceWithFlags, mapDeviceWithFlagsRow } from "@/lib/domain/devices";

export interface DeviceListFilters {
  q?: string;
  group?: string;
  dept?: string;
  status?: string;
  mfr?: string;
  flag?: DeviceFlag | string;
}

export async function listDevices(filters: DeviceListFilters = {}): Promise<DeviceWithFlags[]> {
  const supabase = createClient();
  const settings = await getOrgSettings();
  let q = supabase
    .rpc("devices_with_flags", { p_warranty_days: settings.warrantyExpiringDays })
    .select("*")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (filters.group) q = q.eq("group_id", filters.group);
  if (filters.dept) q = q.eq("department_id", filters.dept);
  if (filters.status) q = q.eq("status", filters.status as "in-use" | "in-storage" | "in-repair" | "retired");
  if (filters.mfr) q = q.eq("manufacturer_id", filters.mfr);
  if (filters.flag === "warranty-expiring") q = q.eq("flag_warranty_expiring", true);
  if (filters.flag === "inventory-overdue") q = q.eq("flag_inventory_overdue", true);
  if (filters.q) {
    const term = filters.q.trim();
    if (term) {
      const safe = escapePostgrestFilter(term);
      q = q.or(
        `name.ilike.%${safe}%,code.ilike.%${safe}%,serial_number.ilike.%${safe}%,model.ilike.%${safe}%`
      );
    }
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(mapDeviceWithFlagsRow);
}
