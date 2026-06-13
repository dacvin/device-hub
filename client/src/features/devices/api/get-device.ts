import { createClient } from "@/lib/supabase/client";
import { getOrgSettings } from "@/features/settings/api/get-org-settings";
import { type Device, type DeviceWithFlags, mapDeviceRow, mapDeviceWithFlagsRow } from "@/lib/domain/devices";

export async function getDeviceWithFlagsByCode(code: string): Promise<DeviceWithFlags | null> {
  const supabase = createClient();
  const settings = await getOrgSettings();
  const { data, error } = await supabase
    .rpc("devices_with_flags", { p_warranty_days: settings.warrantyExpiringDays })
    .select("*")
    .eq("code", code)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data ? mapDeviceWithFlagsRow(data) : null;
}

export async function getDeviceById(id: string): Promise<Device | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("device")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapDeviceRow(data) : null;
}
