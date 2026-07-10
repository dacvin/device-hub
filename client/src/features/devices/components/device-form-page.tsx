'use client';

import { notFound, useRouter } from 'next/navigation';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { PageLayout } from '@/components/app/page-layout';
import { Skeleton } from '@/components/ui/skeleton';

import { useCreateDevice } from '../api/create-device';
import { fromDbDescriptors, useCommitDeviceMedia } from '../api/device-media';
import { useDevice } from '../api/get-device';
import { useNextDeviceCode } from '../api/get-next-device-code';
import { useUpdateDevice } from '../api/update-device';
import { type CreateDeviceFormValues, DEVICE_FORM_DEFAULTS } from '../validations/device';
import { DeviceForm } from './device-form';

import type { FkOption } from './device-fk-field';

export function DeviceCreatePage() {
  const t = useTranslations('devices');
  const router = useRouter();
  const create = useCreateDevice();
  const commitMedia = useCommitDeviceMedia();
  const { data: nextCode, isPending } = useNextDeviceCode();

  if (isPending) {
    return (
      <PageLayout
        title={t('createTitle')}
        backHref="/devices"
        backLabel={t('back')}
        contentWidth={760}
      >
        <Skeleton className="h-96 w-full rounded-xl" />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={t('createTitle')}
      backHref="/devices"
      backLabel={t('back')}
      contentWidth={760}
    >
      <DeviceForm
        defaultValues={{ ...DEVICE_FORM_DEFAULTS, code: nextCode ?? '' }}
        onCancel={() => {
          router.push('/devices');
        }}
        onSubmit={async (values: CreateDeviceFormValues, media) => {
          let device;
          try {
            device = await create.mutateAsync(values);
          } catch (error) {
            const key =
              error instanceof Error && error.message === 'devices.duplicateCode'
                ? 'duplicateCode'
                : 'saveFailed';
            toast.error(t(key));
            return;
          }
          // Device row is saved; a media failure must not read as "save failed".
          try {
            await commitMedia.mutateAsync({
              deviceId: device.id,
              photos: media.photos,
              documents: media.documents,
              existingPhotos: [],
              existingDocuments: [],
            });
            toast.success(t('savedToast'));
          } catch {
            toast.error(t('mediaUploadFailed'));
          }
          router.push(`/devices/${device.id}`);
        }}
      />
    </PageLayout>
  );
}

export function DeviceEditPage({ deviceId }: { deviceId: string }) {
  const t = useTranslations('devices');
  const router = useRouter();
  const update = useUpdateDevice();
  const commitMedia = useCommitDeviceMedia();
  const { data: device, isPending, isError } = useDevice({ deviceId });

  if (isError) notFound();
  if (isPending) {
    return (
      <PageLayout
        title={t('editTitle')}
        backHref={`/devices/${deviceId}`}
        backLabel={t('back')}
        contentWidth={760}
      >
        <Skeleton className="h-96 w-full rounded-xl" />
      </PageLayout>
    );
  }

  const defaults: CreateDeviceFormValues = {
    code: device.code,
    name: device.name,
    groupId: device.groupId,
    unit: device.unit,
    manufacturerId: device.manufacturerId,
    model: device.model ?? '',
    serialNumber: device.serialNumber ?? '',
    specifications: device.specifications ?? '',
    notes: device.notes ?? '',
    status: device.status,
    condition: device.condition,
    quantity: device.quantity,
    source: device.source ?? '',
    location: device.location ?? '',
    importDate: device.importDate ?? '',
    lastCheckDate: device.lastCheckDate ?? '',
    inventoryCycleMonths: device.inventoryCycleMonths,
    warrantyStart: device.warrantyStart ?? '',
    warrantyEnd: device.warrantyEnd ?? '',
  };

  const initialFk: { group?: FkOption; manufacturer?: FkOption } = {
    group: { id: device.groupId, label: device.groupName ?? '' },
    manufacturer: { id: device.manufacturerId, label: device.manufacturerName ?? '' },
  };

  const initialPhotos = fromDbDescriptors(device.photos);
  const initialDocuments = fromDbDescriptors(device.documents);

  return (
    <PageLayout
      title={t('editTitle')}
      backHref={`/devices/${deviceId}`}
      backLabel={t('back')}
      contentWidth={760}
    >
      <DeviceForm
        defaultValues={defaults}
        initialFk={initialFk}
        initialPhotos={initialPhotos}
        initialDocuments={initialDocuments}
        onCancel={() => {
          router.push(`/devices/${deviceId}`);
        }}
        onSubmit={async (values, media) => {
          try {
            await update.mutateAsync({ deviceId, data: values });
          } catch (error) {
            const key =
              error instanceof Error && error.message === 'devices.duplicateCode'
                ? 'duplicateCode'
                : 'saveFailed';
            toast.error(t(key));
            return;
          }
          try {
            await commitMedia.mutateAsync({
              deviceId,
              photos: media.photos,
              documents: media.documents,
              existingPhotos: initialPhotos,
              existingDocuments: initialDocuments,
            });
            toast.success(t('savedToast'));
          } catch {
            toast.error(t('mediaUploadFailed'));
          }
          router.push(`/devices/${deviceId}`);
        }}
      />
    </PageLayout>
  );
}
