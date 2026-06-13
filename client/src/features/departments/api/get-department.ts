import { createClient } from "@/lib/supabase/client";
import { type Department, mapDepartmentRow } from "@/lib/domain/devices";

export async function getDepartmentById(id: string): Promise<Department | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("department")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapDepartmentRow(data) : null;
}
