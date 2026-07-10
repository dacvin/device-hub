'use client';

import { notFound } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { PageLayout } from '@/components/app/page-layout';
import { UserAvatar } from '@/components/app/user-avatar';
import { Skeleton } from '@/components/ui/skeleton';

import { getUserQueryOptions, useUser } from '../api/get-user';
import { getUserActivityQueryOptions, useUserActivity } from '../api/get-user-activity';
import { MemberActions } from './member-actions';
import { MemberActivity } from './member-activity';
import { RoleBadge, StatusIndicator } from './member-badges';
import { MemberInfoCard } from './member-info-card';

export function MemberProfileClient({
  id,
  isAdmin,
  currentUserId,
}: {
  id: string;
  isAdmin: boolean;
  currentUserId: string;
}) {
  const t = useTranslations('members');
  const tRoot = useTranslations();
  const queryClient = useQueryClient();
  const { data: member, isPending, isError } = useUser({ userId: id });
  const { data: activity = [] } = useUserActivity({ userId: id });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: getUserQueryOptions(id).queryKey });
    queryClient.invalidateQueries({ queryKey: getUserActivityQueryOptions(id).queryKey });
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  if (isError) notFound();

  if (isPending) {
    return (
      <PageLayout
        title={<Skeleton className="h-7 w-48" />}
        backHref="/members"
        backLabel={t('back')}
      >
        <Skeleton className="h-56 w-full rounded-xl" />
      </PageLayout>
    );
  }

  const isSelf = member.id === currentUserId;

  return (
    <PageLayout
      title={member.name}
      backHref="/members"
      backLabel={t('back')}
      contentWidth={880}
      actions={
        <MemberActions member={member} isAdmin={isAdmin} isSelf={isSelf} onChanged={refresh} />
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <UserAvatar
            name={member.name}
            className="size-14"
            fallbackClassName="bg-muted text-base font-medium"
          />
          <div className="flex flex-wrap items-center gap-2">
            <RoleBadge role={member.role} t={tRoot} />
            <StatusIndicator status={member.status} t={tRoot} />
            {isSelf && <span className="text-muted-foreground text-sm">· {t('you')}</span>}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <MemberInfoCard member={member} />
          <MemberActivity items={activity} />
        </div>
      </div>
    </PageLayout>
  );
}
