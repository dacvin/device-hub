import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { updateDevice } from "../api/update-device";
import { deviceFormSchema, type DeviceFormValues } from "@/lib/zod/device-form";

export function useUpdateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: DeviceFormValues }) => {
      const parsed = deviceFormSchema.parse(values);
      return updateDevice(id, parsed);
    },
    onSuccess: (device) => {
      qc.invalidateQueries({ queryKey: queryKeys.devices.all });
      qc.invalidateQueries({ queryKey: queryKeys.devices.byCode(device.code) });
      qc.invalidateQueries({ queryKey: queryKeys.devices.byId(device.id) });
      qc.invalidateQueries({ queryKey: queryKeys.overview.summary });
    },
  });
}
