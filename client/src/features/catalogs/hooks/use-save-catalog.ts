import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { saveGroup, type GroupPayload } from "../api/save-group";
import { saveUnit, type UnitPayload } from "../api/save-unit";
import {
  saveManufacturer,
  type ManufacturerPayload,
} from "../api/save-manufacturer";

export function useSaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: GroupPayload) => saveGroup(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.all });
      qc.invalidateQueries({ queryKey: queryKeys.groups.withCounts });
    },
  });
}

export function useSaveUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UnitPayload) => saveUnit(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.units.all });
      qc.invalidateQueries({ queryKey: queryKeys.units.withCounts });
    },
  });
}

export function useSaveManufacturer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ManufacturerPayload) => saveManufacturer(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.manufacturers.all });
      qc.invalidateQueries({ queryKey: queryKeys.manufacturers.withCounts });
    },
  });
}
