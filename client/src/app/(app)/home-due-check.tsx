'use client';

import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import type { DueDevice } from '@/features/devices/api/get-fleet-stats';

export function HomeDueCheck({ items }: { items: DueDevice[] }) {
  const t = useTranslations('home');

  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('dueCheckEmpty')}</p>;
  }

  return (
    <ul className="divide-y">
      {items.map((d) => {
        const overdue = d.overdueDays !== null && d.overdueDays >= 0;
        const label =
          d.overdueDays === null
            ? t('dueNever')
            : d.overdueDays >= 0
              ? t('dueOverdue', { days: d.overdueDays })
              : t('dueSoon', { days: -d.overdueDays });
        return (
          <li key={d.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <Link
                href={`/devices/${d.id}`}
                className="text-primary font-mono text-sm font-medium tracking-[-0.01em] tabular-nums hover:underline"
              >
                {d.code}
              </Link>
              <p className="text-muted-foreground truncate text-sm">{d.name}</p>
            </div>
            <span
              className={cn(
                'shrink-0 rounded-full px-2 py-0.5 font-mono text-xs font-medium tracking-[-0.01em] tabular-nums',
                overdue || d.overdueDays === null
                  ? 'text-status-retired bg-status-retired-soft'
                  : 'text-status-repair bg-status-repair-soft',
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
