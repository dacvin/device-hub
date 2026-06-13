import { createClient } from "@/lib/supabase/client";

export async function softDeleteDevice(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("device")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
