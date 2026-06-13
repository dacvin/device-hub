import { createClient } from "@/lib/supabase/client";
import { type DeviceGroup, type GroupFormValues, mapGroupRow } from "@/lib/domain/devices";

export async function updateGroup(id: string, v: GroupFormValues): Promise<DeviceGroup> {
  const supabase = createClient();
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
