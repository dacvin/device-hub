import { useQuery } from "@tanstack/react-query";
import { listGroupsWithCounts } from "@/features/groups/api/list-groups-with-counts";
import { queryKeys } from "@/lib/queries/keys";

export function useGroupsWithCounts() {
  return useQuery({
    queryKey: queryKeys.groups.withCounts,
    queryFn: listGroupsWithCounts,
  });
}
