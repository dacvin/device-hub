'use client';

import { notFound, useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { CalendarDays, FileText, Images, Layers, MapPin, Pencil, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { LucideIcon } from 'lucide-react';

import { PageLayout } from '@/components/app/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { fromDbDescriptors } from '../api/device-media';
import { useDevice } from '../api/get-device';
import { DeviceDeleteDialog } from './device-delete-dialog';
import { DeviceMediaView } from './device-media-view';
import { DeviceStatusBadge, STATUS_SOLID_CLASS } from './device-status-indicator';

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</dt>
      <dd className="text-sm break-words">{children}</dd>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="gap-0 py-0">
      <div className="flex items-center gap-2 border-b px-5 py-4">
        <Icon className="text-primary size-4" />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

export function DeviceDetailClient({ deviceId }: { deviceId: string }) {
  const t = useTranslations('devices');
  const tRoot = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { data: device, isPending, isError } = useDevice({ deviceId });

  if (isError) notFound();
  if (isPending) {
    return (
      <PageLayout
        title={<Skeleton className="h-7 w-56" />}
        backHref="/devices"
        backLabel={t('back')}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-72 w-full rounded-xl lg:col-span-2" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      </PageLayout>
    );
  }

  const dash = t('empty');
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
  const fmtDate = (v: string | null) => (v ? dateFmt.format(new Date(v)) : dash);
  const unitLabel = t(`unit${device.unit[0].toUpperCase()}${device.unit.slice(1)}`);

  return (
    <PageLayout
      title={device.name}
      backHref="/devices"
      backLabel={t('back')}
      contentWidth={960}
      actions={
        <>
          <Button
            variant="outline"
            onClick={() => {
              router.push(`/devices/${deviceId}/edit`);
            }}
          >
            <Pencil />
            {t('edit')}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setDeleteOpen(true);
            }}
          >
            <Trash2 />
            {t('delete')}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-4 lg:col-span-2">
          <Section icon={Layers} title={t('sectionClassification')}>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
              <Fact label={t('fieldGroup')}>
                {device.groupName ? (
                  <Badge variant="secondary" className="h-auto whitespace-normal">
                    {device.groupName}
                  </Badge>
                ) : (
                  dash
                )}
              </Fact>
              <Fact label={t('fieldManufacturer')}>{device.manufacturerName ?? dash}</Fact>
              <Fact label={t('fieldModel')}>{device.model ?? dash}</Fact>
              <Fact label={t('fieldSerialNumber')}>
                <span className="font-mono tracking-[-0.01em] tabular-nums">
                  {device.serialNumber ?? dash}
                </span>
              </Fact>
            </dl>
            {device.specifications && (
              <div className="mt-5">
                <Fact label={t('fieldSpecifications')}>
                  <p className="whitespace-pre-wrap">{device.specifications}</p>
                </Fact>
              </div>
            )}
          </Section>

          <Section icon={CalendarDays} title={t('sectionLifecycle')}>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
              <Fact label={t('fieldImportDate')}>{fmtDate(device.importDate)}</Fact>
              <Fact label={t('fieldLastCheckDate')}>{fmtDate(device.lastCheckDate)}</Fact>
              <Fact label={t('fieldInventoryCycleMonths')}>
                <span className="font-mono tracking-[-0.01em] tabular-nums">
                  {device.inventoryCycleMonths}
                </span>
              </Fact>
              <Fact label={t('fieldWarrantyStart')}>{fmtDate(device.warrantyStart)}</Fact>
              <Fact label={t('fieldWarrantyEnd')}>{fmtDate(device.warrantyEnd)}</Fact>
            </dl>
          </Section>

          {device.notes && (
            <Section icon={FileText} title={t('sectionNotes')}>
              <p className="text-sm whitespace-pre-wrap">{device.notes}</p>
            </Section>
          )}

          <Section icon={Images} title={t('sectionMedia')}>
            <DeviceMediaView
              photos={fromDbDescriptors(device.photos)}
              documents={fromDbDescriptors(device.documents)}
            />
          </Section>
        </div>

        {/* Summary sidebar */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <Card className="py-0">
            <CardContent className="space-y-5 p-5">
              <div className="space-y-1">
                <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {t('fieldCode')}
                </dt>
                <dd className="font-mono text-lg font-semibold tracking-[-0.01em] tabular-nums">
                  {device.code}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {t('fieldStatus')}
                </span>
                <DeviceStatusBadge status={device.status} t={tRoot} />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    {t('fieldCondition')}
                  </span>
                  <span className="font-mono text-sm font-semibold tracking-[-0.01em] tabular-nums">
                    {device.condition}%
                  </span>
                </div>
                <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className={cn('h-full rounded-full', STATUS_SOLID_CLASS[device.status])}
                    style={{ width: `${device.condition}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {t('fieldLocation')}
                </span>
                <span className="inline-flex items-center gap-1 text-sm">
                  <MapPin className="text-muted-foreground size-3.5" />
                  {device.location ?? dash}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {t('fieldQuantity')}
                </span>
                <span className="font-mono text-sm tracking-[-0.01em] tabular-nums">
                  {device.quantity} {unitLabel}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <DeviceDeleteDialog deviceId={deviceId} isOpen={deleteOpen} onOpenChange={setDeleteOpen} />
    </PageLayout>
  );
}
