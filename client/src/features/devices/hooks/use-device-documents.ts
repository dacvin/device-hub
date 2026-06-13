import { useQuery } from "@tanstack/react-query";
import { listDeviceDocuments } from "@/features/devices/api/list-device-documents";
import { queryKeys } from "@/lib/queries/keys";

export function useDeviceDocuments(deviceId: string) {
  return useQuery({
    queryKey: queryKeys.devices.documents(deviceId),
    queryFn: () => listDeviceDocuments(deviceId),
    enabled: !!deviceId,
  });
}
