import { createClient } from "@/lib/supabase/client";

export async function deleteManufacturer(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("manufacturer").delete().eq("id", id);
  if (error) throw error;
}
