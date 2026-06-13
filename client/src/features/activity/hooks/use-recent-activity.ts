import { useQuery } from "@tanstack/react-query";
import { listRecentActivity } from "@/features/activity/api/list-recent-activity";
import { queryKeys } from "@/lib/queries/keys";

export function useRecentActivity(limit = 5) {
  return useQuery({
    queryKey: queryKeys.activity.recent(limit),
    queryFn: () => listRecentActivity(limit),
  });
}
