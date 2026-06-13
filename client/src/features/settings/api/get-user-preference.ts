import { createClient } from "@/lib/supabase/client";
import { type UserPreference, mapUserPreferenceRow } from "@/lib/domain/settings";

export async function getUserPreference(userId: string): Promise<UserPreference | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_preference")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapUserPreferenceRow(data) : null;
}
