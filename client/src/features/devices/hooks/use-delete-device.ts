import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import {
  bulkSoftDeleteDevices,
  softDeleteDevice,
} from "../api/soft-delete-device";

export function useDeleteDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => softDeleteDevice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.devices.all });
      qc.invalidateQueries({ queryKey: queryKeys.overview.summary });
      qc.invalidateQueries({ queryKey: queryKeys.groups.withCounts });
      qc.invalidateQueries({ queryKey: queryKeys.units.withCounts });
      qc.invalidateQueries({ queryKey: queryKeys.manufacturers.withCounts });
    },
  });
}

export function useBulkDeleteDevices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => bulkSoftDeleteDevices(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.devices.all });
      qc.invalidateQueries({ queryKey: queryKeys.overview.summary });
      qc.invalidateQueries({ queryKey: queryKeys.groups.withCounts });
      qc.invalidateQueries({ queryKey: queryKeys.units.withCounts });
      qc.invalidateQueries({ queryKey: queryKeys.manufacturers.withCounts });
    },
  });
}
