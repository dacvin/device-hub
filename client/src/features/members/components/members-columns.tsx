'use client';

import Link from 'next/link';

import type { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnHeader } from '@/components/app/data-table/data-table-column-header';
import { UserAvatar } from '@/components/user-avatar';
import { cn } from '@/lib/utils';

import { formatRelativeTime } from '../constants/member';
import { RoleBadge, StatusIndicator } from './member-badges';

import type { MemberListItem } from '../types/member';

type T = (key: string) => string;

export function memberColumns({
  t,
  tRoot,
  currentUserId,
}: {
  t: T;
  tRoot: T;
  currentUserId: string;
}): ColumnDef<MemberListItem>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('colMember')} />,
      cell: ({ row }) => {
        const m = row.original;
        const deactivated = m.status === 'deactivated';
        return (
          <div className="flex items-center gap-3">
            <UserAvatar
              name={m.name}
              className="size-8"
              fallbackClassName="bg-muted text-xs font-medium"
            />
            <div className={cn('min-w-0', deactivated && 'opacity-60')}>
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/members/${m.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="truncate font-medium hover:underline"
                >
                  {m.name}
                </Link>
                {m.id === currentUserId && (
                  <span className="bg-secondary text-muted-foreground rounded px-1 text-[10px] font-medium">
                    {t('you')}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground truncate text-xs">{m.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'role',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('colRole')} />,
      cell: ({ row }) => <RoleBadge role={row.original.role} t={tRoot} />,
      filterFn: 'arrIncludesSome',
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('colStatus')} />,
      cell: ({ row }) => <StatusIndicator status={row.original.status} t={tRoot} />,
      filterFn: 'arrIncludesSome',
    },
    {
      accessorKey: 'joinedAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('colJoined')} />,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {formatRelativeTime(row.original.joinedAt)}
        </span>
      ),
      meta: { className: 'hidden md:table-cell' },
    },
  ];
}
