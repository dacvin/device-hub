import type { CamelCaseKeys } from 'camelcase-keys';

import type { Enums, Tables } from '@/types/database.types';

export type UserRole = Enums<'user_role'>;
export type UserStatus = Enums<'user_status'>;

export type MemberDetail = CamelCaseKeys<Tables<'users'>>;
export type Activity = CamelCaseKeys<Tables<'activities'>>;

// Row shape returned by the members list query (camelCased on read).
export type MemberListItem = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  joinedAt: string | null;
};
