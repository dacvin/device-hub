import { createClient } from "@/lib/supabase/client";
import { type Department, mapDepartmentRow } from "@/lib/domain/devices";

export async function listDepartments(): Promise<Department[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("department")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapDepartmentRow);
}
