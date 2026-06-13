import { useQuery } from "@tanstack/react-query";
import { getGroupById } from "@/features/groups/api/get-group";
import { queryKeys } from "@/lib/queries/keys";

export function useGroupById(id: string) {
  return useQuery({
    queryKey: queryKeys.groups.byId(id),
    queryFn: () => getGroupById(id),
    enabled: !!id,
  });
}
