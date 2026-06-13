import { createClient } from "@/lib/supabase/client";
import { type DeviceGroup, mapGroupRow } from "@/lib/domain/devices";

export async function listGroups(): Promise<DeviceGroup[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("device_group")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapGroupRow);
}
