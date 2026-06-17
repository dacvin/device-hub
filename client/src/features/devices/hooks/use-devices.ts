import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { listDevices, type DeviceListFilters } from "../api/list-devices";

export function useDevices(filters: DeviceListFilters) {
  return useQuery({
    queryKey: queryKeys.devices.list(filters),
    queryFn: () => listDevices(filters),
  });
}
