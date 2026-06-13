import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setCoverPhoto } from "@/features/devices/api/set-cover-photo";
import { queryKeys } from "@/lib/queries/keys";

export function useSetCoverPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ deviceId, photoId }: { deviceId: string; photoId: string | null }) =>
      setCoverPhoto(deviceId, photoId),
    onSuccess: (_data, { deviceId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.devices.all });
      qc.invalidateQueries({ queryKey: queryKeys.devices.byId(deviceId) });
    },
  });
}
