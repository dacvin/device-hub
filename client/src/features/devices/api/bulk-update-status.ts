import { createClient } from "@/lib/supabase/client";
import type { DeviceStatus } from "@/lib/domain/devices";

export async function bulkUpdateDeviceStatus(ids: string[], status: DeviceStatus): Promise<void> {
  if (ids.length === 0) return;
  const supabase = createClient();
  const { error } = await supabase
    .from("device")
    .update({ status })
    .in("id", ids);
  if (error) throw error;
}
