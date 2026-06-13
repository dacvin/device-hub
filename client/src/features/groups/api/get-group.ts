import { createClient } from "@/lib/supabase/client";
import { type DeviceGroup, mapGroupRow } from "@/lib/domain/devices";

export async function getGroupById(id: string): Promise<DeviceGroup | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("device_group")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapGroupRow(data) : null;
}
