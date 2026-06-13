import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { listDevices, type DeviceListFilters } from "@/features/devices/api/get-devices";
import type { DeviceWithFlags } from "@/lib/domain/devices";
import { queryKeys } from "@/lib/queries/keys";

type Opts = Omit<UseQueryOptions<DeviceWithFlags[], Error>, "queryKey" | "queryFn">;

export function useDevices(filters: DeviceListFilters = {}, opts: Opts = {}) {
  return useQuery({
    queryKey: queryKeys.devices.list(filters),
    queryFn: () => listDevices(filters),
    ...opts,
  });
}
