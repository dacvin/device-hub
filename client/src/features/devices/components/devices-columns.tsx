'use client';

import Link from 'next/link';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import { ArrowDownLeft, ArrowUpRight, Pencil, Trash2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnHeader } from '@/components/app/data-table/data-table-column-header';
import { IconButton } from '@/components/app/icon-button';
import { cn } from '@/lib/utils';

import { DeviceStatusBadge } from './device-status-indicator';

import type { DeviceListItem } from '../types/device';

function conditionColor(condition: number): string {
  if (condition >= 80) return 'text-status-checked-out';
  if (condition >= 50) return 'text-status-repair';
  return 'text-status-retired';
}

function conditionBar(condition: number): string {
  if (condition >= 80) return 'bg-status-checked-out';
  if (condition >= 50) return 'bg-status-repair';
  return 'bg-status-retired';
}

type T = (key: string, values?: Record<string, string | number>) => string;

export function deviceColumns({
  t,
  tRoot,
  router,
  onDelete,
  onCheckOut,
  onCheckIn,
  onLoanByDeviceId,
}: {
  t: T;
  tRoot: T;
  router: AppRouterInstance;
  onDelete: (device: DeviceListItem) => void;
  onCheckOut: (device: DeviceListItem) => void;
  onCheckIn: (device: DeviceListItem) => void;
  onLoanByDeviceId: Map<string, number>;
}): ColumnDef<DeviceListItem>[] {
  return [
    {
      accessorKey: 'code',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('colCode')} />,
      cell: ({ row }) => (
        <Link
          href={`/devices/${row.original.id}`}
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="text-primary font-mono font-medium tracking-[-0.01em] tabular-nums hover:underline"
        >
          {row.original.code}
        </Link>
      ),
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('colName')} />,
      cell: ({ row }) => {
        const onLoan = onLoanByDeviceId.get(row.original.id);
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{row.original.name}</span>
            {onLoan !== undefined && (
              <span className="bg-status-checked-out-soft text-status-checked-out inline-flex shrink-0 items-center rounded-full px-2 py-0.5 font-mono text-xs font-medium tabular-nums">
                {tRoot('checkouts.nOut', { n: onLoan })}
              </span>
            )}
          </div>
        );
      },
      meta: { className: 'max-w-[26ch] truncate' },
    },
    {
      accessorKey: 'groupName',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('colGroup')} />,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.groupName ?? t('empty')}</span>
      ),
      filterFn: 'arrIncludesSome',
      meta: { className: 'hidden md:table-cell' },
    },
    {
      accessorKey: 'manufacturerName',
      header: t('colManufacturer'),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.manufacturerName ?? t('empty')}</span>
      ),
      enableSorting: false,
      meta: { className: 'hidden lg:table-cell' },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('colStatus')} />,
      cell: ({ row }) => <DeviceStatusBadge status={row.original.status} t={tRoot} />,
      filterFn: 'arrIncludesSome',
    },
    {
      accessorKey: 'condition',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('colCondition')} className="justify-end" />
      ),
      cell: ({ row }) => {
        const c = row.original.condition;
        return (
          <div className="flex items-center justify-end gap-2">
            <div className="bg-muted h-1.5 w-16 overflow-hidden rounded-full">
              <div
                className={cn('h-full rounded-full', conditionBar(c))}
                style={{ width: `${c}%` }}
              />
            </div>
            <span
              className={cn(
                'w-9 text-right font-mono text-xs tracking-[-0.01em] tabular-nums',
                conditionColor(c),
              )}
            >
              {c}%
            </span>
          </div>
        );
      },
      meta: { className: 'text-right' },
    },
    {
      accessorKey: 'quantity',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('colQuantity')} className="justify-end" />
      ),
      cell: ({ row }) => (
        <span className="block text-right font-mono tabular-nums">{row.original.quantity}</span>
      ),
      meta: { className: 'text-right' },
    },
    {
      accessorKey: 'location',
      header: t('colLocation'),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.location ?? t('empty')}</span>
      ),
      enableSorting: false,
      meta: { className: 'hidden lg:table-cell' },
    },
    {
      id: 'actions',
      header: () => null,
      meta: { className: 'w-0' },
      enableSorting: false,
      cell: ({ row }) => {
        const d = row.original;
        const onLoan = onLoanByDeviceId.get(d.id) ?? 0;
        // storage-only policy (mirrors the DB guard); available comes from
        // the same loan-status map that feeds the "n out" pill
        const canCheckOut = d.status === 'storage' && d.quantity - onLoan > 0;
        return (
          <div className="flex justify-end gap-1">
            {onLoan > 0 && (
              <IconButton
                label={tRoot('checkouts.checkIn')}
                variant="ghost"
                size="icon-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onCheckIn(d);
                }}
              >
                <ArrowDownLeft />
              </IconButton>
            )}
            <IconButton
              label={tRoot('checkouts.checkOut')}
              variant="ghost"
              size="icon-sm"
              disabled={!canCheckOut}
              onClick={(e) => {
                e.stopPropagation();
                onCheckOut(d);
              }}
            >
              <ArrowUpRight />
            </IconButton>
            <IconButton
              label={t('edit')}
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/devices/${d.id}/edit`);
              }}
            >
              <Pencil />
            </IconButton>
            <IconButton
              label={t('delete')}
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(d);
              }}
            >
              <Trash2 />
            </IconButton>
          </div>
        );
      },
    },
  ];
}
