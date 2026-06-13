import { createClient } from "@/lib/supabase/client";
import { type DeviceDocument, mapDocumentRow } from "@/lib/domain/devices";

export async function insertDocumentRows(
  deviceId: string,
  docs: { url: string; fileName: string; mimeType: string | null; sizeBytes: number | null }[]
): Promise<DeviceDocument[]> {
  if (docs.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("device_document")
    .insert(
      docs.map((d) => ({
        device_id: deviceId,
        url: d.url,
        file_name: d.fileName,
        mime_type: d.mimeType,
        size_bytes: d.sizeBytes,
      }))
    )
    .select("*");
  if (error) throw error;
  return (data ?? []).map(mapDocumentRow);
}
