import { useQuery } from "@tanstack/react-query";
import { getCurrentMember } from "@/features/auth/api/get-current-member";

export function useCurrentMember() {
  return useQuery({
    queryKey: ["auth", "current-member"] as const,
    queryFn: getCurrentMember,
    staleTime: 5 * 60_000,
  });
}
