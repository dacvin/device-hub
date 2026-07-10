'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

import { ArrowLeftRight, ChevronDown } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useDeviceCheckouts } from '../api/get-checkouts';
import { useDeviceLoanStatus } from '../api/get-device-loan-status';
import { CHECKIN_OUTCOME_LABEL_KEY, CHECKOUT_PHOTOS_BUCKET } from '../constants/checkout';
import { CheckInDialog } from './check-in-dialog';
import { CheckoutDialog } from './checkout-dialog';

import type { CheckinWithPhotos, CheckoutWithDetail } from '../types/checkout';

const CHECKIN_OUTCOME_SOFT_CLASS: Record<CheckinWithPhotos['outcome'], string> = {
  normal: 'bg-status-in-use-soft text-status-in-use',
  consumed: 'bg-status-repair-soft text-status-repair',
  other: 'bg-status-retired-soft text-status-retired',
};

function SoftBadge({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        className,
      )}
    >
      {children}
    </span>
  );
}

function CheckinHistory({ checkins }: { checkins: CheckinWithPhotos[] }) {
  const t = useTranslations('checkouts');
  const tRoot = useTranslations();
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          setOpen((v) => !v);
        }}
        className="text-muted-foreground hover:text-foreground -ml-2"
      >
        <ChevronDown className={cn('transition-transform', open && 'rotate-180')} />
        {t('checkinHistory', { count: checkins.length })}
      </Button>

      {open && (
        <ul className="space-y-3 px-2 pt-1 pb-2">
          {checkins.map((c) => (
            <li key={c.id} className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <SoftBadge className={CHECKIN_OUTCOME_SOFT_CLASS[c.outcome]}>
                  {tRoot(CHECKIN_OUTCOME_LABEL_KEY[c.outcome])}
                </SoftBadge>
                <span className="font-mono tabular-nums">{c.quantity}</span>
                {c.condition !== null && (
                  <span className="text-muted-foreground">
                    {t('checkinCondition', { condition: c.condition })}
                  </span>
                )}
              </div>
              {c.photos.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {c.photos.map((p) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={p.path}
                      src={`/api/device-media/${CHECKOUT_PHOTOS_BUCKET}/${p.path}`}
                      alt={p.fileName}
                      className="size-10 rounded-md border object-cover"
                    />
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CheckoutRow({
  checkout,
  onCheckIn,
}: {
  checkout: CheckoutWithDetail;
  onCheckIn: (checkout: CheckoutWithDetail) => void;
}) {
  const t = useTranslations('checkouts');
  const locale = useLocale();
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });

  return (
    <div className="space-y-2 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="truncate font-medium">{checkout.borrowerName}</span>
        <div className="flex shrink-0 items-center gap-3">
          <span className="font-mono tabular-nums">
            {checkout.outstanding}/{checkout.quantity}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onCheckIn(checkout);
            }}
          >
            {t('checkIn')}
          </Button>
        </div>
      </div>
      <div className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm">
        <span>{checkout.checkedOutByName ?? t('empty')}</span>
        <span>·</span>
        <span>
          {checkout.expectedReturnDate
            ? dateFmt.format(new Date(checkout.expectedReturnDate))
            : t('empty')}
        </span>
        {checkout.status === 'overdue' && (
          <SoftBadge className="bg-status-retired-soft text-status-retired">
            {t('statusOverdue')}
          </SoftBadge>
        )}
      </div>
      <CheckinHistory checkins={checkout.checkins} />
    </div>
  );
}

function ClosedCheckoutRow({ checkout }: { checkout: CheckoutWithDetail }) {
  return (
    <div className="text-muted-foreground py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="truncate">{checkout.borrowerName}</span>
        <span className="font-mono tabular-nums">
          {checkout.outstanding}/{checkout.quantity}
        </span>
      </div>
      <CheckinHistory checkins={checkout.checkins} />
    </div>
  );
}

export function CheckoutsPanel({ deviceId, deviceName }: { deviceId: string; deviceName: string }) {
  const t = useTranslations('checkouts');
  const { data: loanStatus } = useDeviceLoanStatus(deviceId);
  const { data: checkouts } = useDeviceCheckouts(deviceId);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkInTarget, setCheckInTarget] = useState<CheckoutWithDetail | null>(null);

  const available = loanStatus?.available ?? 0;
  const total = loanStatus?.total ?? 0;
  const onLoan = loanStatus?.onLoan ?? 0;

  const active = (checkouts ?? []).filter((c) => c.status !== 'closed');
  const closed = (checkouts ?? []).filter((c) => c.status === 'closed');
  const isEmpty = (checkouts ?? []).length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          {t.rich('availability', {
            available,
            total,
            onLoan,
            num: (chunks) => <span className="font-mono tabular-nums">{chunks}</span>,
            muted: (chunks) => <span className="text-muted-foreground">{chunks}</span>,
          })}
        </p>
        <Button
          type="button"
          size="sm"
          disabled={available <= 0}
          title={available <= 0 ? t('noneAvailable') : undefined}
          onClick={() => {
            setCheckoutOpen(true);
          }}
          className="self-start sm:self-auto"
        >
          {t('checkOut')}
        </Button>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <span className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-full">
            <ArrowLeftRight className="size-4" />
          </span>
          <p className="text-muted-foreground text-sm">{t('noCheckouts')}</p>
        </div>
      ) : (
        <div className="divide-y">
          {active.map((c) => (
            <CheckoutRow key={c.id} checkout={c} onCheckIn={setCheckInTarget} />
          ))}
          {closed.map((c) => (
            <ClosedCheckoutRow key={c.id} checkout={c} />
          ))}
        </div>
      )}

      <CheckoutDialog
        deviceId={deviceId}
        deviceName={deviceName}
        available={available}
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
      />

      {checkInTarget && (
        <CheckInDialog
          checkout={checkInTarget}
          open={!!checkInTarget}
          onOpenChange={(open) => {
            if (!open) setCheckInTarget(null);
          }}
        />
      )}
    </div>
  );
}
