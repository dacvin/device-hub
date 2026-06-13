import { createClient } from "@/lib/supabase/client";
import type { ActivityAction } from "@/lib/domain/activity";

export interface LogActivityInput {
  actorId: string | null;
  action: ActivityAction;
  entityType: string;
  entityId: string | null;
  entityLabel?: string | null;
  metadata?: Record<string, unknown>;
}

export async function logActivity(input: LogActivityInput): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("activity").insert({
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    entity_label: input.entityLabel ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: (input.metadata ?? {}) as any,
  });
  if (error) console.error("logActivity failed", error);
}
