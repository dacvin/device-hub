import { createClient } from "@/lib/supabase/client";

export type ActivityAction = "insert" | "update" | "delete" | "restore";

export interface ActivityItem {
  id: string;
  action: ActivityAction;
  entity_type: string;
  entity_label: string | null;
  created_at: string;
  actor_name: string | null;
}

export async function listRecentActivity(limit = 12): Promise<ActivityItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activities")
    .select(`id, action, entity_type, entity_label, created_at,
             actor:actor_id(name)`)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  type Row = {
    id: string;
    action: ActivityAction;
    entity_type: string;
    entity_label: string | null;
    created_at: string;
    actor: { name: string } | null;
  };
  return ((data ?? []) as unknown as Row[]).map((a) => ({
    id: a.id,
    action: a.action,
    entity_type: a.entity_type,
    entity_label: a.entity_label,
    created_at: a.created_at,
    actor_name: a.actor?.name ?? null,
  }));
}
