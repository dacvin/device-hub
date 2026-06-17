"use client";

import {
  useGroups,
  useManufacturers,
  useUnits,
} from "@/features/catalogs/hooks/use-lookups";
import { DeviceForm } from "../../_components/device-form";
import { DeviceFormSkeleton } from "../../_components/device-form-skeleton";

export function NewDeviceClient() {
  const groups = useGroups();
  const units = useUnits();
  const mfrs = useManufacturers();

  if (groups.isPending || units.isPending || mfrs.isPending) {
    return <DeviceFormSkeleton />;
  }

  return (
    <DeviceForm
      mode="create"
      lookups={{
        groups: groups.data ?? [],
        units: units.data ?? [],
        manufacturers: mfrs.data ?? [],
      }}
    />
  );
}
