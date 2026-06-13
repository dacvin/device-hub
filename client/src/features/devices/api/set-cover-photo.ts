import { createClient } from "@/lib/supabase/client";

export async function setCoverPhoto(deviceId: string, photoId: string | null): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("device")
    .update({ cover_photo_id: photoId })
    .eq("id", deviceId);
  if (error) throw error;
}
