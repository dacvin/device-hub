import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  type Department,
  type DepartmentFormValues,
  mapDepartmentRow,
} from "@/lib/domain/devices";

export interface DepartmentWithCount extends Department {
  deviceCount: number;
}

export async function listDepartments(): Promise<Department[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("department")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapDepartmentRow);
}

export async function listDepartmentsWithCounts(): Promise<DepartmentWithCount[]> {
  const supabase = await createClient();
  const [{ data: rows, error }, { data: counts, error: countErr }] = await Promise.all([
    supabase.from("department").select("*").order("name", { ascending: true }),
    supabase.from("device").select("department_id").is("deleted_at", null),
  ]);
  if (error) throw error;
  if (countErr) throw countErr;
  const tally = new Map<string, number>();
  for (const c of counts ?? []) {
    tally.set(c.department_id, (tally.get(c.department_id) ?? 0) + 1);
  }
  return (rows ?? []).map((r) => ({
    ...mapDepartmentRow(r),
    deviceCount: tally.get(r.id) ?? 0,
  }));
}

export async function getDepartmentById(id: string): Promise<Department | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("department")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapDepartmentRow(data) : null;
}

export async function createDepartment(v: DepartmentFormValues): Promise<Department> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("department")
    .insert({
      name: v.name,
      manager: v.manager || null,
      primary_location: v.primaryLocation || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapDepartmentRow(data);
}

export async function updateDepartment(id: string, v: DepartmentFormValues): Promise<Department> {
  const supabase = await createClient();
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

export async function deleteDepartment(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("department").delete().eq("id", id);
  if (error) throw error;
}
