import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePhotoOrder } from "@/features/devices/api/update-photo-order";
import { queryKeys } from "@/lib/queries/keys";

export function useReorderPhotos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rows }: { deviceId: string; rows: { id: string; sortOrder: number }[] }) =>
      updatePhotoOrder(rows),
    onSuccess: (_data, { deviceId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.devices.photos(deviceId) });
    },
  });
}
