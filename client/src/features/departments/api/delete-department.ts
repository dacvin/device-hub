import { createClient } from "@/lib/supabase/client";

export async function deleteDepartment(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("department").delete().eq("id", id);
  if (error) throw error;
}
