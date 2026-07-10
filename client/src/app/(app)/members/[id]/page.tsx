import { MemberProfileClient } from '@/features/members/components/member-profile-client';
import { getCurrentAppUser } from '@/lib/auth/current-user';

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentAppUser();
  return (
    <MemberProfileClient id={id} isAdmin={user?.role === 'admin'} currentUserId={user?.id ?? ''} />
  );
}
