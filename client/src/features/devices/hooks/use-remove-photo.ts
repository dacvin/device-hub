import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePhotoRow } from "@/features/devices/api/delete-photo-row";
import { removePhotoObject } from "@/features/devices/api/remove-photo-object";
import { queryKeys } from "@/lib/queries/keys";

export function useRemovePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ photoId, storagePath }: { deviceId: string; photoId: string; storagePath: string }) => {
      await removePhotoObject(storagePath);
      await deletePhotoRow(photoId);
    },
    onSuccess: (_data, { deviceId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.devices.photos(deviceId) });
    },
  });
}
