import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkUpdateDeviceStatus } from "@/features/devices/api/bulk-update-status";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import type { DeviceStatus } from "@/lib/domain/devices";
import { queryKeys } from "@/lib/queries/keys";

export function useBulkUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: DeviceStatus }) => {
      await bulkUpdateDeviceStatus(ids, status);
      const me = await getCurrentMember();
      await Promise.all(ids.map((id) =>
        logActivity({ actorId: me?.id ?? null, action: "device.updated", entityType: "device", entityId: id, entityLabel: null })
      ));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.devices.all });
    },
  });
}
