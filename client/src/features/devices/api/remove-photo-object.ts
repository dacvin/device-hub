import { createClient } from "@/lib/supabase/client";
import { PHOTO_BUCKET } from "./signed-photo-urls";

export async function removePhotoObject(path: string): Promise<void> {
  if (!path) return;
  const supabase = createClient();
  await supabase.storage.from(PHOTO_BUCKET).remove([path]);
}
