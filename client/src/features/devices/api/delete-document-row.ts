import { createClient } from "@/lib/supabase/client";

export async function deleteDocumentRow(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("device_document").delete().eq("id", id);
  if (error) throw error;
}
