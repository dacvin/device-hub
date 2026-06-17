import { createClient } from "@/lib/supabase/client";
import {
  DEVICE_SELECT,
  mapDeviceRow,
  type Device,
} from "@/lib/domain/devices";

export async function getDeviceByCode(code: string): Promise<Device | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("devices")
    .select(DEVICE_SELECT)
    .eq("code", code)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data ? mapDeviceRow(data) : null;
}
