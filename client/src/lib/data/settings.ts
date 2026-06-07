import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  type OrgSettings,
  type UserPreference,
  mapOrgSettingsRow,
  mapUserPreferenceRow,
} from "@/lib/domain/settings";

export const getOrgSettings = cache(async (): Promise<OrgSettings> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("org_settings")
    .select("*")
    .eq("id", true)
    .single();
  if (error) throw error;
  return mapOrgSettingsRow(data);
});

export const getUserPreference = cache(async (userId: string): Promise<UserPreference | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_preference")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapUserPreferenceRow(data) : null;
});
