import { Constants } from '@/types/database.types';

export const UserRoles = Constants.public.Enums.user_role;
export const UserStatuses = Constants.public.Enums.user_status;

// Columns the list may sort by (snake_case — matches DB columns).
export const SORTABLE_COLUMNS = ['name', 'joined_at', 'role', 'status'] as const;

// Compact relative-time formatter for the joined column.
export function formatRelativeTime(iso: string | null): string {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(iso).toLocaleDateString();
}
