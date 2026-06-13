import { useMutation, useQueryClient } from "@tanstack/react-query";
import { softDeleteDevice } from "@/features/devices/api/soft-delete-device";
import { getDeviceById } from "@/features/devices/api/get-device";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { queryKeys } from "@/lib/queries/keys";

export function useDeleteDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const [device, me] = await Promise.all([getDeviceById(id), getCurrentMember()]);
      await softDeleteDevice(id);
      await logActivity({
        actorId: me?.id ?? null,
        action: "device.deleted",
        entityType: "device",
        entityId: id,
        entityLabel: device?.name ?? null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.devices.all });
    },
  });
}
