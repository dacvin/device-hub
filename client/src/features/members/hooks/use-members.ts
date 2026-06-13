import { useQuery } from "@tanstack/react-query";
import { listMembers, type MemberListFilters } from "@/features/members/api/get-members";
import { queryKeys } from "@/lib/queries/keys";

export function useMembers(filters: MemberListFilters = {}) {
  return useQuery({
    queryKey: queryKeys.members.list(filters),
    queryFn: () => listMembers(filters),
  });
}
