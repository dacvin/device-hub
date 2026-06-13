import { createClient } from "@/lib/supabase/client";

export async function deleteGroup(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("device_group").delete().eq("id", id);
  if (error) throw error;
}
