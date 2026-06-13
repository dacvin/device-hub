import { useQuery } from "@tanstack/react-query";
import { getUserPreference } from "@/features/settings/api/get-user-preference";
import { queryKeys } from "@/lib/queries/keys";

export function useUserPreference(userId: string) {
  return useQuery({
    queryKey: queryKeys.userPreference(userId),
    queryFn: () => getUserPreference(userId),
    enabled: !!userId,
  });
}
