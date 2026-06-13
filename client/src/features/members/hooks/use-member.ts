import { useQuery } from "@tanstack/react-query";
import { getMemberById } from "@/features/members/api/get-member";
import { queryKeys } from "@/lib/queries/keys";

export function useMember(id: string) {
  return useQuery({
    queryKey: queryKeys.members.byId(id),
    queryFn: () => getMemberById(id),
    enabled: !!id,
  });
}
