import { cn } from '@/lib/utils';

import type { UserRole, UserStatus } from '../types/member';

type T = (key: string) => string;

export const ROLE_LABEL_KEY: Record<UserRole, string> = {
  admin: 'members.roleAdmin',
  member: 'members.roleMember',
};

export const STATUS_LABEL_KEY: Record<UserStatus, string> = {
  active: 'members.statusActive',
  invited: 'members.statusInvited',
  deactivated: 'members.statusDeactivated',
};

const STATUS_CLASS: Record<UserStatus, { soft: string; dot: string }> = {
  active: { soft: 'bg-status-in-use-soft text-status-in-use', dot: 'bg-status-in-use' },
  invited: { soft: 'bg-status-repair-soft text-status-repair', dot: 'bg-status-repair' },
  deactivated: { soft: 'bg-status-storage-soft text-status-storage', dot: 'bg-status-storage' },
};

export function RoleBadge({ role, t }: { role: UserRole; t: T }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        role === 'admin'
          ? 'bg-accent text-accent-foreground'
          : 'bg-secondary text-secondary-foreground',
      )}
    >
      {t(ROLE_LABEL_KEY[role])}
    </span>
  );
}

export function StatusIndicator({ status, t }: { status: UserStatus; t: T }) {
  const s = STATUS_CLASS[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        s.soft,
      )}
    >
      <span aria-hidden className={cn('size-1.5 rounded-full', s.dot)} />
      {t(STATUS_LABEL_KEY[status])}
    </span>
  );
}
