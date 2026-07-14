'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { HardDrive, MapPin, Plus, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { ColumnFiltersState, FilterFn, Table } from '@tanstack/react-table';

import { BulkDeleteButton } from '@/components/app/data-table/bulk-delete-button';
import { DataTable } from '@/components/app/data-table/data-table';
import { FacetedFilter } from '@/components/app/faceted-filter';
import { PageLayout } from '@/components/app/page-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getCheckoutsQueryOptions,
  useDeviceCheckouts,
} from '@/features/checkouts/api/get-checkouts';
import { fetchActiveLoanStatus } from '@/features/checkouts/api/get-device-loan-status';
import { CheckInDialog } from '@/features/checkouts/components/check-in-dialog';
import { CheckoutDialog } from '@/features/checkouts/components/checkout-dialog';
import { cn } from '@/lib/utils';

import { deviceMediaUrl, PHOTOS_BUCKET } from '../api/device-media';
import { useDevicesList } from '../api/get-devices-list';
import { useSoftDeleteDevice } from '../api/soft-delete-device';
import { DeviceStatuses } from '../constants/device';
import { DeviceDeleteDialog } from './device-delete-dialog';
import { DeviceStatusBadge, STATUS_LABEL_KEY, StatusDot } from './device-status-indicator';
import { deviceColumns } from './devices-columns';
import { DevicesSkeleton } from './devices-skeleton';

import type { DeviceListItem } from '../types/device';

// Opens CheckInDialog for a device's single active checkout; with several
// active loans there is no unambiguous target, so it falls through to the
// device page where the checkouts panel lists them all.
function DeviceCheckInGate({
  device,
  onClose,
  router,
}: {
  device: DeviceListItem;
  onClose: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const { data, isFetching } = useDeviceCheckouts(device.id);
  const active = useMemo(() => (data ?? []).filter((c) => c.status !== 'closed'), [data]);
  // an invalidated cache serves stale rows while refetching — deciding on
  // those routes to the wrong place, so wait until the data has settled
  const settled = data !== undefined && !isFetching;

  useEffect(() => {
    if (settled && active.length !== 1) {
      onClose();
      router.push(`/devices/${device.id}`);
    }
  }, [settled, active, onClose, router, device.id]);

  if (!settled || active.length !== 1) return null;
  return (
    <CheckInDialog
      checkout={active[0]}
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    />
  );
}

// Client-side search across code, name and serial number.
const searchFilter: FilterFn<DeviceListItem> = (row, _id, value) => {
  const q = String(value).toLowerCase();
  const d = row.original;
  return [d.code, d.name, d.serialNumber].some((f) => f?.toLowerCase().includes(q));
};

function DevicesToolbar({
  table,
  groupOptions,
}: {
  table: Table<DeviceListItem>;
  groupOptions: { value: string; label: string }[];
}) {
  const t = useTranslations('devices');
  const search = table.getState().globalFilter as string;
  const statusCol = table.getColumn('status');
  const groupCol = table.getColumn('groupName');
  const status = (statusCol?.getFilterValue() as string[] | undefined) ?? [];
  const group = (groupCol?.getFilterValue() as string[] | undefined) ?? [];
  const hasFilters = Boolean(search || status.length || group.length);

  const statusOptions = DeviceStatuses.map((s) => ({
    value: s,
    label: t(STATUS_LABEL_KEY[s].replace('devices.', '')),
    icon: <StatusDot status={s} />,
  }));

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative sm:max-w-xs sm:flex-1">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => {
            table.setGlobalFilter(e.target.value);
          }}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          className="bg-card pl-8"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FacetedFilter
          label={t('filterStatus')}
          options={statusOptions}
          selected={status}
          onChange={(next) => statusCol?.setFilterValue(next.length ? next : undefined)}
          emptyLabel={t('noMatchTitle')}
          clearLabel={t('clearFilters')}
        />
        <FacetedFilter
          label={t('filterGroup')}
          options={groupOptions}
          selected={group}
          onChange={(next) => groupCol?.setFilterValue(next.length ? next : undefined)}
          emptyLabel={t('noMatchTitle')}
          clearLabel={t('clearFilters')}
        />
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              table.setGlobalFilter('');
              table.resetColumnFilters();
            }}
          >
            {t('clearFilters')}
            <X />
          </Button>
        )}
      </div>
    </div>
  );
}

function DeviceMobileCard({ device, coverUrl }: { device: DeviceListItem; coverUrl?: string }) {
  const tRoot = useTranslations();
  return (
    <Link
      href={`/devices/${device.id}`}
      className="bg-card hover:border-primary/40 flex size-full flex-col overflow-hidden rounded-lg border transition-colors active:scale-[0.99]"
    >
      <div className="bg-muted relative aspect-[16/10] w-full overflow-hidden">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="text-muted-foreground/40 flex size-full items-center justify-center">
            <HardDrive className="size-8" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <DeviceStatusBadge status={device.status} t={tRoot} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <span className="text-muted-foreground font-mono text-xs tracking-[-0.01em] tabular-nums">
          {device.code}
        </span>
        <p className="leading-snug font-medium">{device.name}</p>
        {(device.groupName ?? device.location) && (
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            {device.groupName && <span className="min-w-0 truncate">{device.groupName}</span>}
            {device.location && (
              <span className="flex shrink-0 items-center gap-1">
                <MapPin className="size-3" />
                {device.location}
              </span>
            )}
          </div>
        )}
        <div className="mt-auto flex items-center gap-2 pt-1">
          <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
            <div
              className={cn('h-full rounded-full', {
                'bg-status-checked-out': device.condition >= 80,
                'bg-status-repair': device.condition >= 50 && device.condition < 80,
                'bg-status-retired': device.condition < 50,
              })}
              style={{ width: `${device.condition}%` }}
            />
          </div>
          <span className="font-mono text-xs font-medium tabular-nums">{device.condition}%</span>
        </div>
      </div>
    </Link>
  );
}

export function DevicesClient() {
  const t = useTranslations('devices');
  const tRoot = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, isPending } = useDevicesList();
  const [deleting, setDeleting] = useState<DeviceListItem | null>(null);
  const [checkoutTarget, setCheckoutTarget] = useState<DeviceListItem | null>(null);
  const [checkInTarget, setCheckInTarget] = useState<DeviceListItem | null>(null);
  const bulkDelete = useSoftDeleteDevice();

  const groupParam = searchParams.get('group');
  const initialColumnFilters = useMemo<ColumnFiltersState | undefined>(
    () => (groupParam ? [{ id: 'groupName', value: [groupParam] }] : undefined),
    [groupParam],
  );

  const devices = useMemo(() => data ?? [], [data]);
  const { data: loanStatus } = useQuery({
    queryKey: [...getCheckoutsQueryOptions().queryKey, 'loan-status', 'active'],
    queryFn: fetchActiveLoanStatus,
  });
  const onLoanByDeviceId = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of loanStatus ?? []) {
      if (s.onLoan > 0) map.set(s.deviceId, s.onLoan);
    }
    return map;
  }, [loanStatus]);
  const columns = useMemo(
    () =>
      deviceColumns({
        t,
        tRoot,
        router,
        onDelete: setDeleting,
        onCheckOut: setCheckoutTarget,
        onCheckIn: setCheckInTarget,
        onLoanByDeviceId,
      }),
    [t, tRoot, router, onLoanByDeviceId],
  );
  const groupOptions = useMemo(() => {
    const names = [...new Set(devices.map((d) => d.groupName).filter((n): n is string => !!n))];
    names.sort((a, b) => a.localeCompare(b));
    return names.map((n) => ({ value: n, label: n }));
  }, [devices]);

  const emptyState =
    devices.length === 0 ? (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
          <HardDrive className="size-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold">{t('emptyTitle')}</h3>
          <p className="text-muted-foreground text-sm">{t('emptyDescription')}</p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            router.push('/devices/new');
          }}
        >
          <Plus />
          {t('newDevice')}
        </Button>
      </div>
    ) : (
      <div className="text-muted-foreground flex h-64 flex-col items-center justify-center gap-1 text-center text-sm">
        <p className="text-foreground font-medium">{t('noMatchTitle')}</p>
        <p>{t('noMatchDescription')}</p>
      </div>
    );

  return (
    <PageLayout
      title={t('title')}
      subtitle={t('description')}
      fill
      actions={
        <Button
          size="lg"
          onClick={() => {
            router.push('/devices/new');
          }}
        >
          <Plus />
          {t('newDevice')}
        </Button>
      }
    >
      {isPending ? (
        <DevicesSkeleton variant="table" />
      ) : (
        <DataTable
          columns={columns}
          data={devices}
          globalFilterFn={searchFilter}
          enableSelection
          initialColumnFilters={initialColumnFilters}
          countLabel={(n) => t('count', { count: n })}
          selectedLabel={(n) => tRoot('common.selected', { count: n })}
          clearLabel={tRoot('common.clear')}
          renderBulkActions={(rows, clear) => (
            <BulkDeleteButton
              count={rows.length}
              triggerLabel={t('bulkDelete')}
              title={t('bulkDeleteTitle', { count: rows.length })}
              body={t('bulkDeleteBody')}
              cancelLabel={t('cancel')}
              confirmLabel={t('bulkDelete')}
              onDone={clear}
              onDelete={async () => {
                try {
                  await Promise.all(rows.map((r) => bulkDelete.mutateAsync(r.id)));
                  toast.success(t('bulkDeletedToast', { count: rows.length }));
                } catch {
                  toast.error(t('bulkDeleteFailed'));
                }
              }}
            />
          )}
          onRowClick={(d) => {
            router.push(`/devices/${d.id}`);
          }}
          renderToolbar={(table) => <DevicesToolbar table={table} groupOptions={groupOptions} />}
          renderMobileCard={(d) => (
            <DeviceMobileCard
              device={d}
              coverUrl={d.coverPath ? deviceMediaUrl(PHOTOS_BUCKET, d.coverPath) : undefined}
            />
          )}
          emptyState={emptyState}
        />
      )}

      <DeviceDeleteDialog
        deviceId={deleting?.id ?? ''}
        isOpen={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      />

      {checkoutTarget && (
        <CheckoutDialog
          deviceId={checkoutTarget.id}
          deviceName={checkoutTarget.name}
          available={checkoutTarget.quantity - (onLoanByDeviceId.get(checkoutTarget.id) ?? 0)}
          open
          onOpenChange={(open) => {
            if (!open) setCheckoutTarget(null);
          }}
        />
      )}

      {checkInTarget && (
        <DeviceCheckInGate
          device={checkInTarget}
          onClose={() => {
            setCheckInTarget(null);
          }}
          router={router}
        />
      )}
    </PageLayout>
  );
}
