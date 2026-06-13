import { createClient } from "@/lib/supabase/client";
import type { UserPreferenceInput } from "@/lib/domain/settings";

export async function upsertUserPreference(userId: string, patch: UserPreferenceInput): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_preference")
    .upsert({
      user_id: userId,
      theme: patch.theme,
      default_device_view: patch.defaultDeviceView,
      mono_codes: patch.monoCodes,
      updated_at: new Date().toISOString(),
    });
  if (error) throw error;
}
