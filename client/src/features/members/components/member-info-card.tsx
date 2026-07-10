'use client';

import type { ReactNode } from 'react';

import { IdCard } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card, CardContent } from '@/components/ui/card';

import { formatRelativeTime } from '../constants/member';

import type { MemberDetail } from '../types/member';

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</dt>
      <dd className="text-sm break-words">{children}</dd>
    </div>
  );
}

export function MemberInfoCard({ member }: { member: MemberDetail }) {
  const t = useTranslations('members');

  return (
    <Card className="gap-0 py-0">
      <div className="flex items-center gap-2.5 border-b px-5 py-4">
        <span className="bg-accent text-primary flex size-7 items-center justify-center rounded-md">
          <IdCard className="size-4" />
        </span>
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          {t('detailsTitle')}
        </h2>
      </div>
      <CardContent className="p-5">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <Fact label={t('infoPhone')}>{member.phone ?? '—'}</Fact>
          <Fact label={t('infoJoined')}>{formatRelativeTime(member.joinedAt)}</Fact>
          <Fact label={t('infoEmail')}>
            <span className="font-mono text-xs tracking-[-0.01em] break-all">{member.email}</span>
          </Fact>
        </dl>
      </CardContent>
    </Card>
  );
}
