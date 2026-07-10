'use client';

import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { LucideIcon } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { type DeviceActivityEntry, useDeviceActivity } from '../api/get-device-activity';
import { STATUS_LABEL_KEY } from './device-status-indicator';

import type { DeviceActivityAction } from '../api/get-recent-activities';
import type { DeviceStatus } from '../types/device';

const ICON: Record<DeviceActivityAction, LucideIcon> = {
  insert: Plus,
  update: Pencil,
  delete: Trash2,
  restore: RotateCcw,
};

const TONE: Record<DeviceActivityAction, string> = {
  insert: 'text-status-in-use bg-status-in-use-soft',
  update: 'text-primary bg-accent',
  delete: 'text-status-retired bg-status-retired-soft',
  restore: 'text-status-storage bg-status-storage-soft',
};

type T = (key: string, values?: Record<string, string | number>) => string;

// Recent for <7 days ("2 days ago"), else an absolute medium date ("14 Aug 2023").
function relativeOrDate(iso: string, locale: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.round(ms / 86_400_000);
  if (Math.abs(days) < 7) {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const min = Math.round(ms / 60_000);
    if (Math.abs(min) < 60) return rtf.format(-min, 'minute');
    const hr = Math.round(min / 60);
    if (Math.abs(hr) < 24) return rtf.format(-hr, 'hour');
    return rtf.format(-days, 'day');
  }
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));
}

// Turn a before/after snapshot pair into one human line, most-salient change first.
function describe(e: DeviceActivityEntry, t: T, tRoot: T): string {
  if (e.action === 'insert') return t('activityCreated');
  if (e.action === 'delete') return t('activityDeleted');
  if (e.action === 'restore') return t('activityRestored');

  const before = e.before;
  const after = e.after;
  const bStatus = before.status as DeviceStatus | undefined;
  const aStatus = after.status as DeviceStatus | undefined;
  if (aStatus && bStatus !== aStatus) {
    return `${t('fieldStatus')} → ${tRoot(STATUS_LABEL_KEY[aStatus])}`;
  }
  const bCond = before.condition as number | undefined;
  const aCond = after.condition as number | undefined;
  if (aCond != null && bCond !== aCond) {
    return `${t('colCondition')} ${bCond ?? '—'}% → ${aCond}%`;
  }
  const aLoc = after.location as string | null | undefined;
  if (aLoc && before.location !== aLoc) return t('activityMovedTo', { location: aLoc });

  return t('activityUpdated');
}

export function DeviceActivityFeed({ deviceId }: { deviceId: string }) {
  const t = useTranslations('devices');
  const tRoot = useTranslations();
  const locale = useLocale();
  const { data, isPending } = useDeviceActivity(deviceId);

  if (isPending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-7 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('activityEmpty')}</p>;
  }

  return (
    <ul className="space-y-3.5">
      {data.map((e) => {
        const Icon = ICON[e.action];
        return (
          <li key={e.id} className="flex gap-3">
            <span
              className={cn(
                'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full',
                TONE[e.action],
              )}
            >
              <Icon className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-tight font-medium break-words">
                {describe(e, t, tRoot)}
              </p>
              <p className="text-muted-foreground mt-0.5 truncate text-xs">
                {e.actorName ? `${e.actorName} · ` : ''}
                {relativeOrDate(e.createdAt, locale)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
