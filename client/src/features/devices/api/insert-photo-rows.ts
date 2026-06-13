import { createClient } from "@/lib/supabase/client";
import { type DevicePhoto, mapPhotoRow } from "@/lib/domain/devices";

export async function insertPhotoRows(
  deviceId: string,
  photos: { url: string; fileName: string | null; sizeBytes: number | null; sortOrder: number }[]
): Promise<DevicePhoto[]> {
  if (photos.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("device_photo")
    .insert(
      photos.map((p) => ({
        device_id: deviceId,
        url: p.url,
        file_name: p.fileName,
        size_bytes: p.sizeBytes,
        sort_order: p.sortOrder,
      }))
    )
    .select("*");
  if (error) throw error;
  return (data ?? []).map(mapPhotoRow);
}
