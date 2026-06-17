import { createClient } from "@/lib/supabase/client";

export async function softDeleteDevice(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("devices")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function bulkSoftDeleteDevices(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const supabase = createClient();
  const { error } = await supabase
    .from("devices")
    .update({ deleted_at: new Date().toISOString() })
    .in("id", ids);
  if (error) throw error;
  return ids.length;
}
