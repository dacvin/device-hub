import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deviceFormSchema, type DeviceFormValues } from "@/lib/domain/devices";
import { createDevice } from "@/features/devices/api/create-device";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { queryKeys } from "@/lib/queries/keys";

export function useCreateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: DeviceFormValues) => {
      const parsed = deviceFormSchema.parse(values);
      const device = await createDevice(parsed);
      const me = await getCurrentMember();
      await logActivity({
        actorId: me?.id ?? null,
        action: "device.created",
        entityType: "device",
        entityId: device.id,
        entityLabel: device.name,
      });
      return device;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.devices.all });
    },
  });
}
