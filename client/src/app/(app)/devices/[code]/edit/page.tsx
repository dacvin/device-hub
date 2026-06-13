"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { useDeviceByCode } from "@/features/devices/hooks/use-device";
import { useDevicePhotos } from "@/features/devices/hooks/use-device-photos";
import { useDeviceDocuments } from "@/features/devices/hooks/use-device-documents";
import { useSignedPhotoUrls } from "@/features/devices/hooks/use-signed-photo-urls";
import { useSignedDocumentUrls } from "@/features/devices/hooks/use-signed-document-urls";
import { useGroups } from "@/features/groups/hooks/use-groups";
import { useDepartments } from "@/features/departments/hooks/use-departments";
import { useManufacturers } from "@/features/manufacturers/hooks/use-manufacturers";
import { DeviceForm } from "@/app/(app)/devices/_components/device-form";
import { DeviceFormSkeleton } from "@/app/(app)/devices/_components/device-form-skeleton";
import type { DeviceFormValues } from "@/lib/domain/devices";
import type { PhotoItem } from "@/app/(app)/devices/_components/photo-gallery";
import type { DocumentItem } from "@/app/(app)/devices/_components/document-list";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default function EditDevicePage({ params }: PageProps) {
  const { code } = use(params);
  const decodedCode = decodeURIComponent(code);
  const tForm = useTranslations("devices.form");

  const deviceQ = useDeviceByCode(decodedCode);
  const groups = useGroups();
  const depts = useDepartments();
  const mfrs = useManufacturers();
  const photosQ = useDevicePhotos(deviceQ.data?.id ?? "");
  const docsQ = useDeviceDocuments(deviceQ.data?.id ?? "");

  const photoPaths = (photosQ.data ?? []).map((p) => p.url);
  const docPaths = (docsQ.data ?? []).map((d) => d.url);
  const photoUrlsQ = useSignedPhotoUrls(photoPaths);
  const docUrlsQ = useSignedDocumentUrls(docPaths);

  if (
    deviceQ.isPending || groups.isPending || depts.isPending || mfrs.isPending ||
    photosQ.isPending || docsQ.isPending
  ) {
    return <DeviceFormSkeleton pageTitle={tForm("editPageTitle", { name: "" })} />;
  }
  if (!deviceQ.data) notFound();

  const device = deviceQ.data;
  const photoRows = photosQ.data ?? [];
  const docRows = docsQ.data ?? [];
  const photoUrlMap = photoUrlsQ.data ?? {};
  void (docUrlsQ.data ?? {});

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

  const headerGroupIcon = (groups.data ?? []).find((g) => g.id === device.groupId)?.icon ?? null;

  return (
    <DeviceForm
      mode="edit"
      deviceId={device.id}
      initialValues={initialValues}
      initialPhotos={initialPhotos}
      initialDocuments={initialDocuments}
      groups={groups.data ?? []}
      departments={depts.data ?? []}
      manufacturers={mfrs.data ?? []}
      pageTitle={tForm("editPageTitle", { name: device.name })}
      pageSubtitle={device.code}
      headerGroupIcon={headerGroupIcon}
    />
  );
}
