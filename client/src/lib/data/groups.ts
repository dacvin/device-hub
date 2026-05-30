import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  type DeviceGroup,
  type GroupFormValues,
  mapGroupRow,
} from "@/lib/domain/devices";

export interface GroupWithCount extends DeviceGroup {
  deviceCount: number;
}

export async function listGroups(): Promise<DeviceGroup[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("device_group")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapGroupRow);
}

export async function listGroupsWithCounts(): Promise<GroupWithCount[]> {
  const supabase = await createClient();
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

export async function getGroupById(id: string): Promise<DeviceGroup | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("device_group")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapGroupRow(data) : null;
}

export async function createGroup(v: GroupFormValues): Promise<DeviceGroup> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("device_group")
    .insert({
      name: v.name,
      icon: v.icon || null,
      default_inventory_cycle_months: v.defaultInventoryCycleMonths,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapGroupRow(data);
}

export async function updateGroup(id: string, v: GroupFormValues): Promise<DeviceGroup> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("device_group")
    .update({
      name: v.name,
      icon: v.icon || null,
      default_inventory_cycle_months: v.defaultInventoryCycleMonths,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapGroupRow(data);
}

export async function deleteGroup(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("device_group").delete().eq("id", id);
  if (error) throw error;
}
