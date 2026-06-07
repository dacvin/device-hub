import "server-only";
import { createClient } from "@/lib/supabase/server";
import { type Activity, type ActivityAction, mapActivityRow } from "@/lib/domain/activity";

const activitySelect = `*, actor:actor_id(name)`;

export async function listRecentActivity(limit = 5): Promise<Activity[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity")
    .select(activitySelect)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapActivityRow);
}

export async function listActivityForEntity(
  entityType: string,
  entityId: string,
  limit = 20,
): Promise<Activity[]> {
  const supabase = await createClient();
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

export async function listActivityByActor(actorId: string, limit = 20): Promise<Activity[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity")
    .select(activitySelect)
    .eq("actor_id", actorId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapActivityRow);
}

export interface LogActivityInput {
  actorId: string | null;
  action: ActivityAction;
  entityType: string;
  entityId: string | null;
  entityLabel?: string | null;
  metadata?: Record<string, unknown>;
}

export async function logActivity(input: LogActivityInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("activity").insert({
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    entity_label: input.entityLabel ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: (input.metadata ?? {}) as any,
  });
  if (error) {
    console.error("logActivity failed", error);
  }
}
