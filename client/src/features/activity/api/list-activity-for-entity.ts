import { createClient } from "@/lib/supabase/client";
import { type Activity, mapActivityRow } from "@/lib/domain/activity";

const activitySelect = `*, actor:actor_id(name)`;

export async function listActivityForEntity(
  entityType: string,
  entityId: string,
  limit = 20,
): Promise<Activity[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activity")
    .select(activitySelect)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapActivityRow);
}
