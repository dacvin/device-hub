import { createClient } from "@/lib/supabase/client";
import { type Department, mapDepartmentRow } from "@/lib/domain/devices";

export interface DepartmentWithCount extends Department {
  deviceCount: number;
}

export async function listDepartmentsWithCounts(): Promise<DepartmentWithCount[]> {
  const supabase = createClient();
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
