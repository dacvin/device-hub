import { createClient } from "@/lib/supabase/client";
import { type Activity, mapActivityRow } from "@/lib/domain/activity";

const activitySelect = `*, actor:actor_id(name)`;

export async function listRecentActivity(limit = 5): Promise<Activity[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activity")
    .select(activitySelect)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapActivityRow);
}
