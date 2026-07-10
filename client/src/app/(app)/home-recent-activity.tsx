'use client';

import Link from 'next/link';

import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import type {
  DeviceActivity,
  DeviceActivityAction,
} from '@/features/devices/api/get-recent-activities';

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

const VERB_KEY: Record<DeviceActivityAction, string> = {
  insert: 'actionInsert',
  update: 'actionUpdate',
  delete: 'actionDelete',
  restore: 'actionRestore',
};

function relativeTime(iso: string, locale: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const min = Math.round(diff / 60000);
  if (Math.abs(min) < 60) return rtf.format(-min, 'minute');
  const hr = Math.round(min / 60);
  if (Math.abs(hr) < 24) return rtf.format(-hr, 'hour');
  const day = Math.round(hr / 24);
  return rtf.format(-day, 'day');
}

export function HomeRecentActivity({ items }: { items: DeviceActivity[] }) {
  const t = useTranslations('home');
  const locale = useLocale();

  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('activityEmpty')}</p>;
  }

  return (
    <ul className="divide-y">
      {items.map((a) => {
        const Icon = ICON[a.action];
        const label = a.entityLabel ?? '—';
        return (
          <li key={a.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full',
                TONE[a.action],
              )}
            >
              <Icon className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1 text-sm">
              <p className="truncate">
                {a.entityId && a.action !== 'delete' ? (
                  <Link href={`/devices/${a.entityId}`} className="font-medium hover:underline">
                    {label}
                  </Link>
                ) : (
                  <span className="font-medium">{label}</span>
                )}{' '}
                <span className="text-muted-foreground">{t(VERB_KEY[a.action])}</span>
              </p>
              {a.actorName && (
                <p className="text-muted-foreground truncate text-xs">{a.actorName}</p>
              )}
            </div>
            <span className="text-muted-foreground shrink-0 font-mono text-xs tracking-[-0.01em] tabular-nums">
              {relativeTime(a.createdAt, locale)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
