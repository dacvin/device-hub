import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertDocumentRows } from "@/features/devices/api/insert-document-rows";
import { queryKeys } from "@/lib/queries/keys";

export function useInsertDocuments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ deviceId, docs }: {
      deviceId: string;
      docs: { url: string; fileName: string; mimeType: string | null; sizeBytes: number | null }[];
    }) => insertDocumentRows(deviceId, docs),
    onSuccess: (_data, { deviceId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.devices.documents(deviceId) });
    },
  });
}
