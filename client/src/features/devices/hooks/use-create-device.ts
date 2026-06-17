import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { createDevice } from "../api/create-device";
import { deviceFormSchema, type DeviceFormValues } from "@/lib/zod/device-form";

export function useCreateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: DeviceFormValues) => {
      const parsed = deviceFormSchema.parse(values);
      return createDevice(parsed);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.devices.all });
      qc.invalidateQueries({ queryKey: queryKeys.overview.summary });
      qc.invalidateQueries({ queryKey: queryKeys.groups.withCounts });
      qc.invalidateQueries({ queryKey: queryKeys.units.withCounts });
      qc.invalidateQueries({ queryKey: queryKeys.manufacturers.withCounts });
    },
  });
}
