'use client';

import type { ReactNode } from 'react';

import { useTranslations } from 'next-intl';

import { Card, CardContent } from '@/components/ui/card';

import { formatRelativeTime } from '../constants/member';
import { RoleBadge, StatusIndicator } from './member-badges';

import type { MemberDetail } from '../types/member';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium break-words">{children}</dd>
    </div>
  );
}

export function MemberInfoCard({ member }: { member: MemberDetail }) {
  const t = useTranslations('members');
  const tRoot = useTranslations();

  return (
    <Card className="gap-0 py-0">
      <div className="border-b px-5 py-4">
        <h2 className="text-sm font-semibold">{t('detailsTitle')}</h2>
      </div>
      <CardContent className="px-5 py-2">
        <dl className="divide-y">
          <Row label={t('infoName')}>{member.name}</Row>
          <Row label={t('infoEmail')}>
            <span className="font-mono text-xs tracking-[-0.01em] tabular-nums">
              {member.email}
            </span>
          </Row>
          <Row label={t('infoPhone')}>{member.phone ?? '—'}</Row>
          <Row label={t('infoRole')}>
            <RoleBadge role={member.role} t={tRoot} />
          </Row>
          <Row label={t('infoStatus')}>
            <StatusIndicator status={member.status} t={tRoot} />
          </Row>
          <Row label={t('infoJoined')}>{formatRelativeTime(member.joinedAt)}</Row>
        </dl>
      </CardContent>
    </Card>
  );
}
