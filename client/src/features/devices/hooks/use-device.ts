import { useQuery } from "@tanstack/react-query";
import { getDeviceWithFlagsByCode } from "@/features/devices/api/get-device";
import { queryKeys } from "@/lib/queries/keys";

export function useDeviceByCode(code: string) {
  return useQuery({
    queryKey: queryKeys.devices.byCode(code),
    queryFn: () => getDeviceWithFlagsByCode(code),
    enabled: !!code,
  });
}
