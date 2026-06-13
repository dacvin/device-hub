import { useQuery } from "@tanstack/react-query";
import { listActivityByActor } from "@/features/activity/api/list-activity-by-actor";
import { queryKeys } from "@/lib/queries/keys";

export function useActivityByActor(actorId: string, limit = 20) {
  return useQuery({
    queryKey: queryKeys.activity.byActor(actorId, limit),
    queryFn: () => listActivityByActor(actorId, limit),
    enabled: !!actorId,
  });
}
