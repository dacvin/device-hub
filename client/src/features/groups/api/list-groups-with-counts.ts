import { createClient } from "@/lib/supabase/client";
import { type DeviceGroup, mapGroupRow } from "@/lib/domain/devices";

export interface GroupWithCount extends DeviceGroup {
  deviceCount: number;
}

export async function listGroupsWithCounts(): Promise<GroupWithCount[]> {
  const supabase = createClient();
  const [{ data: rows, error }, { data: counts, error: countErr }] = await Promise.all([
    supabase.from("device_group").select("*").order("name", { ascending: true }),
    supabase.from("device").select("group_id").is("deleted_at", null),
  ]);
  if (error) throw error;
  if (countErr) throw countErr;
  const tally = new Map<string, number>();
  for (const c of counts ?? []) {
    tally.set(c.group_id, (tally.get(c.group_id) ?? 0) + 1);
  }
  return (rows ?? []).map((r) => ({
    ...mapGroupRow(r),
    deviceCount: tally.get(r.id) ?? 0,
  }));
}
