import { InviteDialog } from '@/features/auth/components/invite-dialog';
import { MembersClient } from '@/features/members/components/members-client';
import { getCurrentAppUser } from '@/lib/auth/current-user';

export default async function MembersPage() {
  const user = await getCurrentAppUser();
  const isAdmin = user?.role === 'admin';
  return (
    <MembersClient
      isAdmin={isAdmin}
      currentUserId={user?.id ?? ''}
      inviteSlot={isAdmin ? <InviteDialog /> : undefined}
    />
  );
}
