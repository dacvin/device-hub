import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkSoftDeleteDevices } from "@/features/devices/api/bulk-soft-delete";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { queryKeys } from "@/lib/queries/keys";

export function useBulkDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await bulkSoftDeleteDevices(ids);
      const me = await getCurrentMember();
      await Promise.all(ids.map((id) =>
        logActivity({ actorId: me?.id ?? null, action: "device.deleted", entityType: "device", entityId: id, entityLabel: null })
      ));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.devices.all });
    },
  });
}
