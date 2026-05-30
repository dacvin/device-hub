import { listDepartments } from "@/lib/data/departments";
import { listGroups } from "@/lib/data/groups";
import { listManufacturers } from "@/lib/data/manufacturers";
import { DeviceForm } from "@/app/(app)/devices/_components/device-form";
import type { DeviceFormValues } from "@/lib/domain/devices";

export const dynamic = "force-dynamic";

const defaults: DeviceFormValues = {
  name: "",
  code: "",
  groupId: "",
  departmentId: "",
  manufacturerId: null,
  model: "",
  serialNumber: "",
  specifications: "",
  notes: "",
  condition: 100,
  location: "",
  quantity: 1,
  unit: "piece",
  source: null,
  status: "in-storage",
  importDate: null,
  lastCheckDate: null,
  inventoryCycleMonths: 12,
  warrantyStart: null,
  warrantyEnd: null,
};

export default async function NewDevicePage() {
  const [groups, departments, manufacturers] = await Promise.all([
    listGroups(),
    listDepartments(),
    listManufacturers(),
  ]);

  return (
    <DeviceForm
      mode="create"
      initialValues={defaults}
      initialPhotos={[]}
      initialDocuments={[]}
      groups={groups}
      departments={departments}
      manufacturers={manufacturers}
      pageTitle="Add device"
      pageSubtitle="Register a new asset in the inventory"
    />
  );
}
