import { createClient } from "@/lib/supabase/client";
import { type Department, type DepartmentFormValues, mapDepartmentRow } from "@/lib/domain/devices";

export async function updateDepartment(id: string, v: DepartmentFormValues): Promise<Department> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("department")
    .update({
      name: v.name,
      manager: v.manager || null,
      primary_location: v.primaryLocation || null,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapDepartmentRow(data);
}
