'use client';

import { notFound, useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ReactNode } from 'react';

import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  Fingerprint,
  HardDrive,
  Images,
  Layers,
  MapPin,
  Pencil,
  ScrollText,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
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
import { DeviceActivityFeed } from './device-activity-feed';
import { DeviceDeleteDialog } from './device-delete-dialog';
import { DeviceMediaView } from './device-media-view';
import { DeviceStatusBadge } from './device-status-indicator';

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
      <div className="flex items-center gap-2.5 border-b px-5 py-4">
        <span className="bg-accent text-primary flex size-7 items-center justify-center rounded-md">
          <Icon className="size-4" />
        </span>
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          {title}
        </h2>
      </div>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

function MetaRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="bg-muted text-muted-foreground mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="text-sm font-medium break-words">{children}</p>
      </div>
    </div>
  );
}

function ConditionRing({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = 34;
  const circ = 2 * Math.PI * r;
  const color =
    clamped >= 80
      ? 'text-status-in-use'
      : clamped >= 50
        ? 'text-status-repair'
        : 'text-status-retired';
  return (
    <div className="relative size-20 shrink-0">
      <svg viewBox="0 0 80 80" className="size-20 -rotate-90">
        <circle
          cx="40"
          cy="40"
          r={r}
          strokeWidth="7"
          className="fill-none stroke-current opacity-15"
        />
        <circle
          cx="40"
          cy="40"
          r={r}
          strokeWidth="7"
          strokeLinecap="round"
          className={cn('fill-none stroke-current transition-all', color)}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - clamped / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-lg font-semibold tabular-nums">
        {clamped}%
      </span>
    </div>
  );
}

// Date.now() lives in module scope so the React Compiler purity rule doesn't
// flag it as an impure call inside the component render.
function daysUntil(v: string | null): number | null {
  return v ? Math.ceil((new Date(v).getTime() - Date.now()) / 86_400_000) : null;
}

function isPast(d: Date): boolean {
  return d.getTime() < Date.now();
}

function AlertBadge({
  icon: Icon,
  tone,
  children,
}: {
  icon: LucideIcon;
  tone: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        tone,
      )}
    >
      <Icon className="size-3" />
      {children}
    </span>
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
          <Skeleton className="h-96 w-full rounded-xl lg:col-span-2" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </PageLayout>
    );
  }

  const dash = t('empty');
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
  const fmtDate = (v: string | null) => (v ? dateFmt.format(new Date(v)) : dash);
  const unitLabel = t(`unit${device.unit[0].toUpperCase()}${device.unit.slice(1)}`);
  const sourceLabel = device.source
    ? t(`source${device.source[0].toUpperCase()}${device.source.slice(1)}`)
    : dash;

  const warrantyDaysLeft = daysUntil(device.warrantyEnd);
  const warrantyExpired = warrantyDaysLeft !== null && warrantyDaysLeft <= 0;
  const warrantyExpiring =
    warrantyDaysLeft !== null && warrantyDaysLeft > 0 && warrantyDaysLeft <= 90;

  const checkBase = device.lastCheckDate ?? device.importDate;
  let nextCheckDue: Date | null = null;
  if (checkBase && device.inventoryCycleMonths) {
    nextCheckDue = new Date(checkBase);
    nextCheckDue.setMonth(nextCheckDue.getMonth() + device.inventoryCycleMonths);
  }
  const inventoryOverdue = nextCheckDue ? isPast(nextCheckDue) : false;

  const conditionDesc =
    device.condition >= 80
      ? t('conditionGood')
      : device.condition >= 50
        ? t('conditionFair')
        : t('conditionPoor');

  const coverage =
    warrantyDaysLeft === null
      ? dash
      : warrantyExpired
        ? t('warrantyExpired')
        : t('warrantyDaysLeft', { days: warrantyDaysLeft });

  return (
    <PageLayout
      title={device.name}
      backHref="/devices"
      backLabel={t('back')}
      contentWidth={1120}
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
      {/* Identity strip: icon · code · badges */}
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="bg-accent text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
          <HardDrive className="size-5" />
        </span>
        <span className="font-mono text-sm font-medium tracking-[-0.01em] tabular-nums">
          {device.code}
        </span>
        <span className="bg-border h-4 w-px" aria-hidden />
        <div className="flex flex-wrap items-center gap-2">
          {device.groupName && <Badge variant="secondary">{device.groupName}</Badge>}
          <DeviceStatusBadge status={device.status} t={tRoot} />
          {warrantyExpiring && (
            <AlertBadge icon={ShieldCheck} tone="bg-status-repair-soft text-status-repair">
              {t('alertWarrantyExpiring')}
            </AlertBadge>
          )}
          {inventoryOverdue && (
            <AlertBadge icon={AlertTriangle} tone="bg-status-retired-soft text-status-retired">
              {t('alertInventoryOverdue')}
            </AlertBadge>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main column */}
        <div className="order-2 space-y-4 lg:order-1 lg:col-span-2">
          <Section icon={Fingerprint} title={t('sectionIdentification')}>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <Fact label={t('fieldName')}>{device.name}</Fact>
              <Fact label={t('fieldSerialNumber')}>
                <span className="font-mono tracking-[-0.01em] tabular-nums">
                  {device.serialNumber ?? dash}
                </span>
              </Fact>
              <Fact label={t('fieldManufacturer')}>{device.manufacturerName ?? dash}</Fact>
              <Fact label={t('fieldModel')}>{device.model ?? dash}</Fact>
              <Fact label={t('fieldGroup')}>{device.groupName ?? dash}</Fact>
            </dl>
          </Section>

          {device.specifications && (
            <Section icon={HardDrive} title={t('sectionSpecifications')}>
              <p className="text-sm whitespace-pre-wrap">{device.specifications}</p>
            </Section>
          )}

          <Section icon={MapPin} title={t('sectionAllocation')}>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <Fact label={t('fieldLocation')}>{device.location ?? dash}</Fact>
              <Fact label={t('fieldUnit')}>{unitLabel}</Fact>
              <Fact label={t('fieldQuantity')}>
                <span className="font-mono tracking-[-0.01em] tabular-nums">{device.quantity}</span>
              </Fact>
              <Fact label={t('fieldSource')}>{sourceLabel}</Fact>
            </dl>
          </Section>

          <Section icon={CalendarDays} title={t('sectionLifecycle')}>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <Fact label={t('fieldImportDate')}>{fmtDate(device.importDate)}</Fact>
              <Fact label={t('fieldInventoryCycleMonths')}>
                <span className="font-mono tracking-[-0.01em] tabular-nums">
                  {device.inventoryCycleMonths}
                </span>
              </Fact>
              <Fact label={t('fieldLastCheckDate')}>{fmtDate(device.lastCheckDate)}</Fact>
              <Fact label={t('fieldNextCheckDue')}>
                {nextCheckDue ? dateFmt.format(nextCheckDue) : dash}
              </Fact>
            </dl>
          </Section>

          <Section icon={ShieldCheck} title={t('sectionWarranty')}>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <Fact label={t('fieldWarrantyStart')}>{fmtDate(device.warrantyStart)}</Fact>
              <Fact label={t('fieldWarrantyEnd')}>{fmtDate(device.warrantyEnd)}</Fact>
              <Fact label={t('fieldCoverage')}>{coverage}</Fact>
            </dl>
          </Section>

          {device.notes && (
            <Section icon={ScrollText} title={t('sectionNotes')}>
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
        <div className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-0 lg:self-start">
          <Card className="py-0">
            <CardContent className="space-y-4 p-5">
              <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                {t('sectionCondition')}
              </h2>
              <div className="flex items-center gap-4">
                <ConditionRing value={device.condition} />
                <div className="min-w-0">
                  <p className="font-medium">{conditionDesc}</p>
                  {device.lastCheckDate && (
                    <p className="text-muted-foreground text-sm">
                      {t('lastAssessed', { date: fmtDate(device.lastCheckDate) })}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardContent className="space-y-4 p-5">
              <MetaRow icon={ShieldCheck} label={t('sectionWarranty')}>
                {device.warrantyEnd
                  ? `${coverage} · ${t('warrantyEndsOn', { date: fmtDate(device.warrantyEnd) })}`
                  : dash}
              </MetaRow>
              <MetaRow icon={CalendarClock} label={t('nextInventory')}>
                {nextCheckDue ? dateFmt.format(nextCheckDue) : dash}
              </MetaRow>
              <MetaRow icon={MapPin} label={t('fieldLocation')}>
                {device.location ?? dash}
              </MetaRow>
              <MetaRow icon={Layers} label={t('fieldGroup')}>
                {device.groupName ?? dash}
              </MetaRow>
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardContent className="space-y-4 p-5">
              <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                {t('sectionActivity')}
              </h2>
              <DeviceActivityFeed deviceId={deviceId} />
            </CardContent>
          </Card>
        </div>
      </div>

      <DeviceDeleteDialog deviceId={deviceId} isOpen={deleteOpen} onOpenChange={setDeleteOpen} />
    </PageLayout>
  );
}
