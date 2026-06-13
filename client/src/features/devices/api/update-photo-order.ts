import { createClient } from "@/lib/supabase/client";

export async function updatePhotoOrder(
  rows: { id: string; sortOrder: number }[]
): Promise<void> {
  if (rows.length === 0) return;
  const supabase = createClient();
  for (const r of rows) {
    const { error } = await supabase
      .from("device_photo")
      .update({ sort_order: r.sortOrder })
      .eq("id", r.id);
    if (error) throw error;
  }
}
