'use client';

import Link from 'next/link';

import { ArrowLeftRight } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnHeader } from '@/components/app/data-table/data-table-column-header';
import { IconButton } from '@/components/app/icon-button';
import { cn } from '@/lib/utils';

import { CHECKOUT_STATUS_LABEL_KEY } from '../constants/checkout';

import type { CheckoutListItem, CheckoutStatus } from '../types/checkout';

type T = (key: string, values?: Record<string, string | number>) => string;

// Soft pill (tinted background + on-color text); colour never carries meaning
// alone — the label is always visible. Mirrors DeviceStatusBadge's shape.
const STATUS_SOFT_CLASS: Record<CheckoutStatus, string> = {
  outstanding: 'bg-status-checked-out-soft text-status-checked-out',
  overdue: 'bg-status-retired-soft text-status-retired',
  closed: 'bg-status-storage-soft text-status-storage',
};

const STATUS_SOLID_CLASS: Record<CheckoutStatus, string> = {
  outstanding: 'bg-status-checked-out',
  overdue: 'bg-status-retired',
  closed: 'bg-status-storage',
};

export function CheckoutStatusBadge({ status, t }: { status: CheckoutStatus; t: T }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        STATUS_SOFT_CLASS[status],
      )}
    >
      <span aria-hidden className={cn('size-1.5 rounded-full', STATUS_SOLID_CLASS[status])} />
      {t(CHECKOUT_STATUS_LABEL_KEY[status])}
    </span>
  );
}

export function checkoutColumns({
  t,
  tRoot,
  onCheckIn,
}: {
  t: T;
  tRoot: T;
  onCheckIn: (checkout: CheckoutListItem) => void;
}): ColumnDef<CheckoutListItem>[] {
  const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

  return [
    {
      accessorKey: 'deviceName',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('colDevice')} />,
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div
            className={cn(
              '-ml-2 flex flex-col gap-0.5 border-l-2 pl-2',
              c.status === 'overdue' ? 'border-l-status-retired' : 'border-l-transparent',
            )}
          >
            <Link
              href={`/devices/${c.deviceId}`}
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="text-primary font-mono text-xs tracking-[-0.01em] tabular-nums hover:underline"
            >
              {c.deviceCode}
            </Link>
            <span className="font-medium">{c.deviceName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'borrowerName',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('colBorrower')} />,
    },
    {
      accessorKey: 'outstanding',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('colQty')} className="justify-end" />
      ),
      cell: ({ row }) => {
        const c = row.original;
        return (
          <span className="font-mono tabular-nums">
            <span className="font-semibold">{c.outstanding}</span>
            <span className="text-muted-foreground">/{c.quantity}</span>
          </span>
        );
      },
      meta: { className: 'text-right' },
    },
    {
      accessorKey: 'checkedOutByName',
      header: t('colBy'),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.checkedOutByName ?? t('empty')}</span>
      ),
      enableSorting: false,
      meta: { className: 'hidden lg:table-cell' },
    },
    {
      accessorKey: 'checkedOutAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('colDate')} />,
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {dateFmt.format(new Date(row.original.checkedOutAt))}
        </span>
      ),
      meta: { className: 'hidden lg:table-cell' },
    },
    {
      accessorKey: 'expectedReturnDate',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('colExpected')} />,
      cell: ({ row }) => {
        const d = row.original.expectedReturnDate;
        return (
          <span className="text-muted-foreground">
            {d ? dateFmt.format(new Date(d)) : t('empty')}
          </span>
        );
      },
      meta: { className: 'hidden lg:table-cell' },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('colStatus')} />,
      cell: ({ row }) => <CheckoutStatusBadge status={row.original.status} t={tRoot} />,
      filterFn: 'arrIncludesSome',
    },
    {
      id: 'actions',
      header: () => null,
      meta: { className: 'w-0' },
      enableSorting: false,
      cell: ({ row }) => {
        const c = row.original;
        if (c.status === 'closed') return null;
        return (
          <div className="flex justify-end">
            <IconButton
              label={t('checkIn')}
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                onCheckIn(c);
              }}
            >
              <ArrowLeftRight />
            </IconButton>
          </div>
        );
      },
    },
  ];
}
