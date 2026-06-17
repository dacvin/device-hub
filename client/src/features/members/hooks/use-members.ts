import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { listMembers } from "../api/list-members";
import {
  getCurrentUserRow,
  getMemberByEmail,
} from "../api/get-member-by-email";

export function useMembers() {
  return useQuery({
    queryKey: queryKeys.members.all,
    queryFn: listMembers,
  });
}

export function useMemberByEmail(email: string) {
  return useQuery({
    queryKey: queryKeys.members.byEmail(email),
    queryFn: () => getMemberByEmail(email),
    enabled: !!email,
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.members.current,
    queryFn: getCurrentUserRow,
  });
}
