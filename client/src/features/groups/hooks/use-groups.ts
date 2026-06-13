import { useQuery } from "@tanstack/react-query";
import { listGroups } from "@/features/groups/api/list-groups";
import { queryKeys } from "@/lib/queries/keys";

export function useGroups() {
  return useQuery({
    queryKey: queryKeys.groups.all,
    queryFn: listGroups,
  });
}
