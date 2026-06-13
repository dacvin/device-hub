import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteDocumentRow } from "@/features/devices/api/delete-document-row";
import { removeDocumentObject } from "@/features/devices/api/remove-document-object";
import { queryKeys } from "@/lib/queries/keys";

export function useRemoveDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ docId, storagePath }: { deviceId: string; docId: string; storagePath: string }) => {
      await removeDocumentObject(storagePath);
      await deleteDocumentRow(docId);
    },
    onSuccess: (_data, { deviceId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.devices.documents(deviceId) });
    },
  });
}
