"use client";

import { useTranslations } from "next-intl";
import { useGroups } from "@/features/groups/hooks/use-groups";
import { useDepartments } from "@/features/departments/hooks/use-departments";
import { useManufacturers } from "@/features/manufacturers/hooks/use-manufacturers";
import { DeviceForm } from "@/app/(app)/devices/_components/device-form";
import { DeviceFormSkeleton } from "@/app/(app)/devices/_components/device-form-skeleton";
import type { DeviceFormValues } from "@/lib/domain/devices";

const defaults: DeviceFormValues = {
  name: "", code: "", groupId: "", departmentId: "", manufacturerId: null,
  model: "", serialNumber: "", specifications: "", notes: "", condition: 100,
  location: "", quantity: 1, unit: "piece", source: null, status: "in-storage",
  importDate: null, lastCheckDate: null, inventoryCycleMonths: 12,
  warrantyStart: null, warrantyEnd: null,
};

export default function NewDevicePage() {
  const t = useTranslations("devices.new");
  const groups = useGroups();
  const depts = useDepartments();
  const mfrs = useManufacturers();

  if (groups.isPending || depts.isPending || mfrs.isPending) {
    return <DeviceFormSkeleton pageTitle={t("pageTitle")} pageSubtitle={t("pageSubtitle")} />;
  }

  return (
    <DeviceForm
      mode="create"
      initialValues={defaults}
      initialPhotos={[]}
      initialDocuments={[]}
      groups={groups.data ?? []}
      departments={depts.data ?? []}
      manufacturers={mfrs.data ?? []}
      pageTitle={t("pageTitle")}
      pageSubtitle={t("pageSubtitle")}
    />
  );
}
