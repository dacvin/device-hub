'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { ArrowLeftRight, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { FilterFn } from '@tanstack/react-table';

import { DataTable } from '@/components/app/data-table/data-table';
import { PageLayout } from '@/components/app/page-layout';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { useCheckoutsList, useDeviceCheckouts } from '../api/get-checkouts';
import { CheckInDialog } from './check-in-dialog';
import { CheckoutLauncher } from './checkout-launcher';
import { checkoutColumns, CheckoutStatusBadge } from './checkouts-columns';

import type { CheckoutListItem, CheckoutStatus } from '../types/checkout';

const TABS: { value: CheckoutStatus | 'all'; labelKey: string }[] = [
  { value: 'all', labelKey: 'tabAll' },
  { value: 'outstanding', labelKey: 'tabOutstanding' },
  { value: 'overdue', labelKey: 'tabOverdue' },
  { value: 'closed', labelKey: 'tabClosed' },
];

// Client-side search across device code/name and borrower name.
const searchFilter: FilterFn<CheckoutListItem> = (row, _id, value) => {
  const q = String(value).toLowerCase();
  const c = row.original;
  return [c.deviceCode, c.deviceName, c.borrowerName].some((f) => f.toLowerCase().includes(q));
};

function CheckoutsTabs({
  active,
  onChange,
  counts,
}: {
  active: CheckoutStatus | 'all';
  onChange: (value: CheckoutStatus | 'all') => void;
  counts: Record<CheckoutStatus | 'all', number>;
}) {
  const t = useTranslations('checkouts');
  return (
    <div className="overflow-x-auto border-b">
      <nav className="-mb-px flex gap-4 sm:gap-6">
        {TABS.map((tab) => {
          const isActive = tab.value === active;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                onChange(tab.value);
              }}
              className={cn(
                'flex shrink-0 items-center gap-1.5 border-b-2 px-1 pb-3 text-sm font-medium whitespace-nowrap transition-colors',
                isActive
                  ? 'border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground border-transparent',
              )}
            >
              {t(tab.labelKey)}
              <span className="font-mono tabular-nums">{counts[tab.value]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function CheckoutMobileCard({
  checkout,
  onCheckIn,
}: {
  checkout: CheckoutListItem;
  onCheckIn: (checkout: CheckoutListItem) => void;
}) {
  const t = useTranslations('checkouts');
  const tRoot = useTranslations();
  const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

  return (
    <div className="bg-card flex size-full flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/devices/${checkout.deviceId}`}
          className="min-w-0 flex-1 space-y-0.5"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <p className="truncate font-medium">{checkout.deviceName}</p>
          <p className="text-muted-foreground font-mono text-xs tracking-[-0.01em] tabular-nums">
            {checkout.deviceCode}
          </p>
        </Link>
        <CheckoutStatusBadge status={checkout.status} t={tRoot} />
      </div>
      <p className="font-medium">{checkout.borrowerName}</p>
      <div className="text-muted-foreground space-y-0.5 text-xs">
        <p>
          <span className="font-mono tabular-nums">
            {checkout.outstanding}/{checkout.quantity}
          </span>{' '}
          {t('colQty').toLowerCase()}
        </p>
        <p>
          {checkout.expectedReturnDate
            ? dateFmt.format(new Date(checkout.expectedReturnDate))
            : t('empty')}
        </p>
      </div>
      {checkout.status !== 'closed' && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCheckIn(checkout);
          }}
          className="border-input mt-1 inline-flex min-h-9 items-center self-start rounded-md border px-3 text-sm font-medium"
        >
          {t('checkIn')}
        </button>
      )}
    </div>
  );
}

// Fetches the checked-in target's full detail (the row action only has the
// list-item shape) and renders CheckInDialog once found — mirrors the lookup
// CheckoutsPanel already does per-device, scoped here to a single checkout id.
function CheckInGate({
  target,
  onOpenChange,
}: {
  target: CheckoutListItem;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: detail } = useDeviceCheckouts(target.deviceId);
  const checkout = detail?.find((c) => c.id === target.id);
  if (!checkout) return null;
  return <CheckInDialog checkout={checkout} open onOpenChange={onOpenChange} />;
}

function CheckoutsSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="bg-muted/40 flex items-center gap-4 border-b px-4 py-3">
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-0">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-10" />
        </div>
      ))}
    </div>
  );
}

export function CheckoutsClient() {
  const t = useTranslations('checkouts');
  const tRoot = useTranslations();
  const router = useRouter();
  const { data, isPending } = useCheckoutsList();
  const [tab, setTab] = useState<CheckoutStatus | 'all'>('outstanding');
  const [checkInTarget, setCheckInTarget] = useState<CheckoutListItem | null>(null);

  const checkouts = useMemo(() => data ?? [], [data]);
  const counts = useMemo(
    () => ({
      all: checkouts.length,
      outstanding: checkouts.filter((c) => c.status === 'outstanding').length,
      overdue: checkouts.filter((c) => c.status === 'overdue').length,
      closed: checkouts.filter((c) => c.status === 'closed').length,
    }),
    [checkouts],
  );
  const filtered = useMemo(
    () => (tab === 'all' ? checkouts : checkouts.filter((c) => c.status === tab)),
    [checkouts, tab],
  );

  const columns = useMemo(
    () => checkoutColumns({ t, tRoot, onCheckIn: setCheckInTarget }),
    [t, tRoot],
  );

  const emptyState =
    checkouts.length === 0 ? (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
          <ArrowLeftRight className="size-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold">{t('emptyTitle')}</h3>
          <p className="text-muted-foreground text-sm">{t('emptyDescription')}</p>
        </div>
      </div>
    ) : (
      <div className="text-muted-foreground flex h-64 flex-col items-center justify-center gap-1 text-center text-sm">
        <p className="text-foreground font-medium">{t('noMatchTitle')}</p>
        <p>{t('noMatchDescription')}</p>
      </div>
    );

  return (
    <PageLayout title={t('title')} subtitle={t('description')} fill actions={<CheckoutLauncher />}>
      <div className="mb-4">
        <CheckoutsTabs active={tab} onChange={setTab} counts={counts} />
      </div>
      {isPending ? (
        <CheckoutsSkeleton />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          globalFilterFn={searchFilter}
          countLabel={(n) => t('count', { count: n })}
          onRowClick={(c) => {
            router.push(`/devices/${c.deviceId}`);
          }}
          renderToolbar={(table) => (
            <div className="relative sm:max-w-xs">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                value={table.getState().globalFilter as string}
                onChange={(e) => {
                  table.setGlobalFilter(e.target.value);
                }}
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchPlaceholder')}
                className="bg-card pl-8"
              />
            </div>
          )}
          renderMobileCard={(c) => <CheckoutMobileCard checkout={c} onCheckIn={setCheckInTarget} />}
          emptyState={emptyState}
        />
      )}

      {checkInTarget && (
        <CheckInGate
          target={checkInTarget}
          onOpenChange={(open) => {
            if (!open) setCheckInTarget(null);
          }}
        />
      )}
    </PageLayout>
  );
}
