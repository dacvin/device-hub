import { createClient } from "@/lib/supabase/client";
import { type Device, type DeviceFormValues, deviceFormToInsert, mapDeviceRow } from "@/lib/domain/devices";
import type { Database } from "@/types/database.types";

export async function updateDevice(id: string, values: DeviceFormValues): Promise<Device> {
  const supabase = createClient();
  const update: Database["public"]["Tables"]["device"]["Update"] = deviceFormToInsert(values);
  const { data, error } = await supabase
    .from("device")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapDeviceRow(data);
}
