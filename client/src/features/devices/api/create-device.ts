import { createClient } from "@/lib/supabase/client";
import { type Device, type DeviceFormValues, deviceFormToInsert, mapDeviceRow } from "@/lib/domain/devices";

export async function createDevice(values: DeviceFormValues): Promise<Device> {
  const supabase = createClient();
  const insert = deviceFormToInsert(values);
  const { data, error } = await supabase
    .from("device")
    .insert(insert)
    .select("*")
    .single();
  if (error) throw error;
  return mapDeviceRow(data);
}
