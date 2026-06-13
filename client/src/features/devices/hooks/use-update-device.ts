import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deviceFormSchema, type DeviceFormValues } from "@/lib/domain/devices";
import { updateDevice } from "@/features/devices/api/update-device";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { queryKeys } from "@/lib/queries/keys";

export function useUpdateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: DeviceFormValues }) => {
      const parsed = deviceFormSchema.parse(values);
      const device = await updateDevice(id, parsed);
      const me = await getCurrentMember();
      await logActivity({
        actorId: me?.id ?? null,
        action: "device.updated",
        entityType: "device",
        entityId: device.id,
        entityLabel: device.name,
      });
      return device;
    },
    onSuccess: (device) => {
      qc.invalidateQueries({ queryKey: queryKeys.devices.all });
      qc.invalidateQueries({ queryKey: queryKeys.devices.byCode(device.code) });
    },
  });
}
