import { useQuery } from "@tanstack/react-query";
import { listDevicePhotos } from "@/features/devices/api/list-device-photos";
import { queryKeys } from "@/lib/queries/keys";

export function useDevicePhotos(deviceId: string) {
  return useQuery({
    queryKey: queryKeys.devices.photos(deviceId),
    queryFn: () => listDevicePhotos(deviceId),
    enabled: !!deviceId,
  });
}
