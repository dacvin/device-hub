import { createClient } from "@/lib/supabase/client";
import type { DeviceFormValues } from "@/lib/zod/device-form";
import {
  DEVICE_SELECT,
  mapDeviceRow,
  type Device,
} from "@/lib/domain/devices";
import { formToInsertRow } from "./create-device";

export async function updateDevice(
  id: string,
  values: DeviceFormValues,
): Promise<Device> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("devices")
    .update(formToInsertRow(values))
    .eq("id", id)
    .select(DEVICE_SELECT)
    .single();
  if (error) throw error;
  return mapDeviceRow(data);
}
