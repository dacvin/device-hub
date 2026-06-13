import { createClient } from "@/lib/supabase/client";

export async function deletePhotoRow(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("device_photo").delete().eq("id", id);
  if (error) throw error;
}
