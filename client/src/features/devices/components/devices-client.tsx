'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { HardDrive, Plus, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { ColumnFiltersState, FilterFn, Table } from '@tanstack/react-table';

import { BulkDeleteButton } from '@/components/app/data-table/bulk-delete-button';
import { DataTable } from '@/components/app/data-table/data-table';
import { FacetedFilter } from '@/components/app/faceted-filter';
import { PageLayout } from '@/components/app/page-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useDevicesList } from '../api/get-devices-list';
import { useSoftDeleteDevice } from '../api/soft-delete-device';
import { DeviceStatuses } from '../constants/device';
import { DeviceDeleteDialog } from './device-delete-dialog';
import { STATUS_LABEL_KEY, StatusDot } from './device-status-indicator';
import { deviceColumns } from './devices-columns';
import { DevicesSkeleton } from './devices-skeleton';

import type { DeviceListItem } from '../types/device';

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

export function DevicesClient() {
  const t = useTranslations('devices');
  const tRoot = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, isPending } = useDevicesList();
  const [deleting, setDeleting] = useState<DeviceListItem | null>(null);
  const bulkDelete = useSoftDeleteDevice();

  const groupParam = searchParams.get('group');
  const initialColumnFilters = useMemo<ColumnFiltersState | undefined>(
    () => (groupParam ? [{ id: 'groupName', value: [groupParam] }] : undefined),
    [groupParam],
  );

  const devices = useMemo(() => data ?? [], [data]);
  const columns = useMemo(
    () => deviceColumns({ t, tRoot, router, onDelete: setDeleting }),
    [t, tRoot, router],
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
    </PageLayout>
  );
}
