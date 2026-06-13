import { useQuery } from "@tanstack/react-query";
import { countDevicesManagedBy } from "@/features/members/api/count-devices-managed-by";
import { queryKeys } from "@/lib/queries/keys";

export function useDeviceCountManagedBy(departmentId: string | null) {
  return useQuery({
    queryKey: queryKeys.members.deviceCount(departmentId),
    queryFn: () => countDevicesManagedBy(departmentId),
  });
}
