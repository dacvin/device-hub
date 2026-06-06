import { notFound } from "next/navigation";
import {
  getDeviceWithFlagsByCode,
  listDeviceDocuments,
  listDevicePhotos,
} from "@/lib/data/devices";
import { listDepartments } from "@/lib/data/departments";
import { listGroups } from "@/lib/data/groups";
import { listManufacturers } from "@/lib/data/manufacturers";
import { signedDocumentUrls, signedPhotoUrls } from "@/lib/data/storage";
import { DeviceForm } from "@/app/(app)/devices/_components/device-form";
import type { DeviceFormValues } from "@/lib/domain/devices";
import type { PhotoItem } from "@/app/(app)/devices/_components/photo-gallery";
import type { DocumentItem } from "@/app/(app)/devices/_components/document-list";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function EditDevicePage({ params }: PageProps) {
  const { code } = await params;
  const decodedCode = decodeURIComponent(code);
  const device = await getDeviceWithFlagsByCode(decodedCode);
  if (!device) notFound();

  const [groups, departments, manufacturers, photoRows, docRows] = await Promise.all([
    listGroups(),
    listDepartments(),
    listManufacturers(),
    listDevicePhotos(device.id),
    listDeviceDocuments(device.id),
  ]);

  const photoUrlMap = await signedPhotoUrls(photoRows.map((p) => p.url));
  const docUrlMap = await signedDocumentUrls(docRows.map((d) => d.url));

  const initialPhotos: PhotoItem[] = photoRows.map((p) => ({
    key: p.id,
    dbId: p.id,
    storagePath: p.url,
    previewUrl: photoUrlMap[p.url] ?? "",
    fileName: p.fileName,
    sizeBytes: p.sizeBytes,
  }));

  const initialDocuments: DocumentItem[] = docRows.map((d) => ({
    key: d.id,
    dbId: d.id,
    storagePath: d.url,
    fileName: d.fileName,
    mimeType: d.mimeType,
    sizeBytes: d.sizeBytes,
  }));
  void docUrlMap; // not displayed here; details page handles document open links

  const initialValues: DeviceFormValues = {
    name: device.name,
    code: device.code,
    groupId: device.groupId,
    departmentId: device.departmentId,
    manufacturerId: device.manufacturerId,
    model: device.model ?? "",
    serialNumber: device.serialNumber ?? "",
    specifications: device.specifications ?? "",
    notes: device.notes ?? "",
    condition: device.condition,
    location: device.location ?? "",
    quantity: device.quantity,
    unit: device.unit,
    source: device.source,
    status: device.status,
    importDate: device.importDate,
    lastCheckDate: device.lastCheckDate,
    inventoryCycleMonths: device.inventoryCycleMonths,
    warrantyStart: device.warrantyStart,
    warrantyEnd: device.warrantyEnd,
  };

  const headerGroupIcon = groups.find((g) => g.id === device.groupId)?.icon ?? null;

  return (
    <DeviceForm
      mode="edit"
      deviceId={device.id}
      initialValues={initialValues}
      initialPhotos={initialPhotos}
      initialDocuments={initialDocuments}
      groups={groups}
      departments={departments}
      manufacturers={manufacturers}
      pageTitle={`Edit ${device.name}`}
      pageSubtitle={device.code}
      headerGroupIcon={headerGroupIcon}
    />
  );
}
