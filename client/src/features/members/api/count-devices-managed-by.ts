import { createClient } from "@/lib/supabase/client";

export async function countDevicesManagedBy(departmentId: string | null): Promise<number> {
  if (!departmentId) return 0;
  const supabase = createClient();
  const { count, error } = await supabase
    .from("device")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .eq("department_id", departmentId);
  if (error) throw error;
  return count ?? 0;
}
