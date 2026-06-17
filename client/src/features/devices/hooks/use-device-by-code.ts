import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { getDeviceByCode } from "../api/get-device-by-code";

export function useDeviceByCode(code: string) {
  return useQuery({
    queryKey: queryKeys.devices.byCode(code),
    queryFn: () => getDeviceByCode(code),
    enabled: !!code,
  });
}
