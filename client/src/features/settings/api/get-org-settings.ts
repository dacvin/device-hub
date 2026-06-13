import { createClient } from "@/lib/supabase/client";
import { type OrgSettings, mapOrgSettingsRow } from "@/lib/domain/settings";

export async function getOrgSettings(): Promise<OrgSettings> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("org_settings")
    .select("*")
    .eq("id", true)
    .single();
  if (error) throw error;
  return mapOrgSettingsRow(data);
}
