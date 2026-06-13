import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertPhotoRows } from "@/features/devices/api/insert-photo-rows";
import { queryKeys } from "@/lib/queries/keys";

export function useInsertPhotos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ deviceId, photos }: {
      deviceId: string;
      photos: { url: string; fileName: string | null; sizeBytes: number | null; sortOrder: number }[];
    }) => insertPhotoRows(deviceId, photos),
    onSuccess: (_data, { deviceId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.devices.photos(deviceId) });
    },
  });
}
