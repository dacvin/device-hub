'use client';

import { Activity as ActivityIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card, CardContent } from '@/components/ui/card';

import { formatRelativeTime } from '../constants/member';

import type { Activity } from '../types/member';

export function MemberActivity({ items }: { items: Activity[] }) {
  const t = useTranslations('members');

  return (
    <Card className="gap-0 py-0">
      <div className="flex items-center gap-2 border-b px-5 py-4">
        <ActivityIcon className="text-primary size-4" />
        <h2 className="text-sm font-semibold">{t('activityTitle')}</h2>
      </div>
      <CardContent className="px-5 py-4">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('activityEmpty')}</p>
        ) : (
          <ul className="space-y-3">
            {items.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="font-medium">{a.action}</span>
                  <span className="text-muted-foreground"> · {a.entityLabel ?? a.entityType}</span>
                </span>
                <span className="text-muted-foreground shrink-0 font-mono text-xs tracking-[-0.01em] tabular-nums">
                  {formatRelativeTime(a.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
