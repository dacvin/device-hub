import { createClient } from "@/lib/supabase/client";
import { type DevicePhoto, mapPhotoRow } from "@/lib/domain/devices";

export async function listDevicePhotos(deviceId: string): Promise<DevicePhoto[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("device_photo")
    .select("*")
    .eq("device_id", deviceId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapPhotoRow);
}
