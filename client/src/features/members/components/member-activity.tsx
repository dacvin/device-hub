'use client';

import { History, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { formatRelativeTime } from '../constants/member';

import type { Activity } from '../types/member';

const ICON: Record<string, LucideIcon> = {
  insert: Plus,
  update: Pencil,
  delete: Trash2,
  restore: RotateCcw,
};

const TONE: Record<string, string> = {
  insert: 'text-status-checked-out bg-status-checked-out-soft',
  update: 'text-primary bg-accent',
  delete: 'text-status-retired bg-status-retired-soft',
  restore: 'text-status-storage bg-status-storage-soft',
};

export function MemberActivity({ items }: { items: Activity[] }) {
  const t = useTranslations('members');

  return (
    <Card className="gap-0 py-0">
      <div className="flex items-center gap-2.5 border-b px-5 py-4">
        <span className="bg-accent text-primary flex size-7 items-center justify-center rounded-md">
          <History className="size-4" />
        </span>
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          {t('activityTitle')}
        </h2>
      </div>
      <CardContent className="p-5">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('activityEmpty')}</p>
        ) : (
          <ul className="space-y-3.5">
            {items.map((a) => {
              const Icon = ICON[a.action] ?? Pencil;
              return (
                <li key={a.id} className="flex gap-3">
                  <span
                    className={cn(
                      'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full',
                      TONE[a.action] ?? 'bg-muted text-muted-foreground',
                    )}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-tight font-medium break-words">
                      {a.entityLabel ?? a.entityType}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {formatRelativeTime(a.createdAt)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
