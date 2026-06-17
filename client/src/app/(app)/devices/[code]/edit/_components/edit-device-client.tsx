"use client";

import { notFound } from "next/navigation";
import { useDeviceByCode } from "@/features/devices/hooks/use-device-by-code";
import {
  useGroups,
  useManufacturers,
  useUnits,
} from "@/features/catalogs/hooks/use-lookups";
import { DeviceForm } from "../../../_components/device-form";
import { DeviceFormSkeleton } from "../../../_components/device-form-skeleton";

export function EditDeviceClient({ code }: { code: string }) {
  const device = useDeviceByCode(code);
  const groups = useGroups();
  const units = useUnits();
  const mfrs = useManufacturers();

  if (device.isPending || groups.isPending || units.isPending || mfrs.isPending) {
    return <DeviceFormSkeleton />;
  }
  if (!device.data) notFound();

  const d = device.data;
  return (
    <DeviceForm
      mode="edit"
      device={{
        id: d.id,
        code: d.code,
        name: d.name,
        groupIcon: d.groupIcon,
        groupName: d.groupName,
      }}
      initial={{
        name: d.name,
        code: d.code,
        groupId: d.groupId,
        status: d.status,
        manufacturerId: d.manufacturerId ?? "",
        model: d.model ?? "",
        serialNumber: d.serialNumber ?? "",
        unitId: d.unitId,
        quantity: d.quantity,
        specifications: d.specifications ?? "",
        source: (d.source ?? "") as never,
        importDate: d.importDate ?? "",
        condition: d.condition,
        location: d.location ?? "",
        lastCheckDate: d.lastCheckDate ?? "",
        inventoryCycleMonths: d.inventoryCycleMonths,
        warrantyStart: d.warrantyStart ?? "",
        warrantyEnd: d.warrantyEnd ?? "",
        notes: d.notes ?? "",
      }}
      lookups={{
        groups: groups.data ?? [],
        units: units.data ?? [],
        manufacturers: mfrs.data ?? [],
      }}
    />
  );
}
