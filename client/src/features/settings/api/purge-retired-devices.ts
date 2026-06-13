import { createClient } from "@/lib/supabase/client";
import { getOrgSettings } from "./get-org-settings";

export async function purgeRetiredDevices(): Promise<number> {
  const supabase = createClient();
  const settings = await getOrgSettings();
  const cutoff = new Date(Date.now() - settings.deletedRetentionDays * 86400_000).toISOString();
  const { data, error } = await supabase
    .from("device")
    .delete()
    .eq("status", "retired")
    .lt("updated_at", cutoff)
    .select("id");
  if (error) throw error;
  return data?.length ?? 0;
}
