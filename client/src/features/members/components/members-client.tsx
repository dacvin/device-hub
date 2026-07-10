'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import type { ReactNode } from 'react';

import { Search, Users, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { FilterFn, Table } from '@tanstack/react-table';

import { DataTable } from '@/components/app/data-table/data-table';
import { FacetedFilter } from '@/components/app/faceted-filter';
import { PageLayout } from '@/components/app/page-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/user-avatar';

import { useMembersList } from '../api/get-members-list';
import { UserRoles, UserStatuses } from '../constants/member';
import { ROLE_LABEL_KEY, RoleBadge, STATUS_LABEL_KEY, StatusIndicator } from './member-badges';
import { memberColumns } from './members-columns';
import { MembersSkeleton } from './members-skeleton';

import type { MemberListItem } from '../types/member';

const searchFilter: FilterFn<MemberListItem> = (row, _id, value) => {
  const q = String(value).toLowerCase();
  const m = row.original;
  return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
};

function MembersToolbar({ table }: { table: Table<MemberListItem> }) {
  const t = useTranslations('members');
  const search = table.getState().globalFilter as string;
  const roleCol = table.getColumn('role');
  const statusCol = table.getColumn('status');
  const role = (roleCol?.getFilterValue() as string[] | undefined) ?? [];
  const status = (statusCol?.getFilterValue() as string[] | undefined) ?? [];
  const hasFilters = Boolean(search || role.length || status.length);

  const roleOptions = UserRoles.map((r) => ({
    value: r,
    label: t(ROLE_LABEL_KEY[r].replace('members.', '')),
  }));
  const statusOptions = UserStatuses.map((s) => ({
    value: s,
    label: t(STATUS_LABEL_KEY[s].replace('members.', '')),
  }));

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative sm:max-w-xs sm:flex-1">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => {
            table.setGlobalFilter(e.target.value);
          }}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          className="bg-card pl-8"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FacetedFilter
          label={t('filterRole')}
          options={roleOptions}
          selected={role}
          onChange={(next) => roleCol?.setFilterValue(next.length ? next : undefined)}
          emptyLabel={t('noMatchTitle')}
          clearLabel={t('clearFilters')}
        />
        <FacetedFilter
          label={t('filterStatus')}
          options={statusOptions}
          selected={status}
          onChange={(next) => statusCol?.setFilterValue(next.length ? next : undefined)}
          emptyLabel={t('noMatchTitle')}
          clearLabel={t('clearFilters')}
        />
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              table.setGlobalFilter('');
              table.resetColumnFilters();
            }}
          >
            {t('clearFilters')}
            <X />
          </Button>
        )}
      </div>
    </div>
  );
}

function MemberMobileCard({ member }: { member: MemberListItem }) {
  const tRoot = useTranslations();
  return (
    <Link
      href={`/members/${member.id}`}
      className="hover:bg-secondary/50 active:bg-secondary flex items-center gap-3 px-4 py-3 transition-colors"
    >
      <UserAvatar
        name={member.name}
        className="size-9"
        fallbackClassName="bg-muted text-xs font-medium"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{member.name}</p>
        <p className="text-muted-foreground truncate text-xs">{member.email}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <RoleBadge role={member.role} t={tRoot} />
        <StatusIndicator status={member.status} t={tRoot} />
      </div>
    </Link>
  );
}

export function MembersClient({
  isAdmin,
  currentUserId,
  inviteSlot,
}: {
  isAdmin: boolean;
  currentUserId: string;
  inviteSlot?: ReactNode;
}) {
  const t = useTranslations('members');
  const tRoot = useTranslations();
  const router = useRouter();
  const { data, isPending } = useMembersList();

  const members = useMemo(() => data ?? [], [data]);
  const columns = useMemo(
    () => memberColumns({ t, tRoot, currentUserId }),
    [t, tRoot, currentUserId],
  );

  const emptyState = (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
        <Users className="size-6" />
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold">
          {members.length === 0 ? t('emptyTitle') : t('noMatchTitle')}
        </h3>
        <p className="text-muted-foreground text-sm">
          {members.length === 0 ? t('emptyDescription') : t('noMatchDescription')}
        </p>
      </div>
    </div>
  );

  return (
    <PageLayout
      title={t('title')}
      subtitle={t('description')}
      fill
      actions={isAdmin ? inviteSlot : undefined}
    >
      {isPending ? (
        <MembersSkeleton variant="table" />
      ) : (
        <DataTable
          columns={columns}
          data={members}
          globalFilterFn={searchFilter}
          enableSelection
          countLabel={(n) => t('count', { count: n })}
          selectedLabel={(n) => tRoot('common.selected', { count: n })}
          clearLabel={tRoot('common.clear')}
          onRowClick={(m) => {
            router.push(`/members/${m.id}`);
          }}
          renderToolbar={(table) => <MembersToolbar table={table} />}
          renderMobileCard={(m) => <MemberMobileCard member={m} />}
          emptyState={emptyState}
        />
      )}
    </PageLayout>
  );
}
