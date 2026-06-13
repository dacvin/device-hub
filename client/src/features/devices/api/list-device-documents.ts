import { createClient } from "@/lib/supabase/client";
import { type DeviceDocument, mapDocumentRow } from "@/lib/domain/devices";

export async function listDeviceDocuments(deviceId: string): Promise<DeviceDocument[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("device_document")
    .select("*")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapDocumentRow);
}
