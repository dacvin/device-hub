import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { listRecentActivity } from "../api/list-recent-activity";
import { listActivityForEntity } from "../api/list-activity-for-entity";

export function useRecentActivity(limit = 12) {
  return useQuery({
    queryKey: queryKeys.activity.recent(limit),
    queryFn: () => listRecentActivity(limit),
  });
}

export function useActivityForEntity(
  entityType: string,
  entityId: string | undefined,
  limit = 8,
) {
  return useQuery({
    queryKey: queryKeys.activity.forEntity(entityType, entityId ?? "", limit),
    queryFn: () => listActivityForEntity(entityType, entityId ?? "", limit),
    enabled: !!entityId,
  });
}
