'use client';

import { useState } from 'react';

import { KeyRound, Link2, Loader2, Pencil, Power, PowerOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import { resendInvite } from '../actions/resend-invite';
import { resetPassword } from '../actions/reset-password';
import { setMemberStatus } from '../actions/set-member-status';
import { LinkResultDialog } from './link-result-dialog';
import { MemberEditDialog } from './member-edit-dialog';

import type { MemberDetail } from '../types/member';

type LinkState = { title: string; actionLink: string } | null;

export function MemberActions({
  member,
  isAdmin,
  isSelf,
  onChanged,
}: {
  member: MemberDetail;
  isAdmin: boolean;
  isSelf: boolean;
  onChanged: () => void;
}) {
  const t = useTranslations('members');
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmActivate, setConfirmActivate] = useState(false);
  const [link, setLink] = useState<LinkState>(null);
  const [isBusy, setIsBusy] = useState(false);

  const canEdit = isAdmin || isSelf;
  const deactivated = member.status === 'deactivated';

  async function changeStatus(status: 'active' | 'deactivated') {
    setIsBusy(true);
    try {
      await setMemberStatus({ userId: member.id, status });
      toast.success(t('statusChangedToast'));
      onChanged();
    } catch {
      toast.error(t('statusFailedToast'));
    } finally {
      setIsBusy(false);
      setConfirmDeactivate(false);
      setConfirmActivate(false);
    }
  }

  async function makeLink(kind: 'reset' | 'invite') {
    try {
      const { actionLink } =
        kind === 'reset'
          ? await resetPassword({ email: member.email })
          : await resendInvite({ email: member.email });
      setLink({
        title: kind === 'reset' ? t('linkResetTitle') : t('linkInviteTitle'),
        actionLink,
      });
    } catch {
      toast.error(t('linkFailedToast'));
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canEdit && (
        <Button
          variant="outline"
          onClick={() => {
            setIsEditing(true);
          }}
        >
          <Pencil />
          {t('actionEdit')}
        </Button>
      )}
      {isAdmin && (
        <Button variant="outline" onClick={() => makeLink('reset')}>
          <KeyRound />
          {t('actionResetPassword')}
        </Button>
      )}
      {isAdmin && member.status === 'invited' && (
        <Button variant="outline" onClick={() => makeLink('invite')}>
          <Link2 />
          {t('actionCopyInvite')}
        </Button>
      )}
      {isAdmin && (
        <>
          <Separator orientation="vertical" className="h-6" />
          {deactivated ? (
            <Button
              variant="outline"
              onClick={() => {
                setConfirmActivate(true);
              }}
            >
              <Power />
              {t('actionActivate')}
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmDeactivate(true);
              }}
            >
              <PowerOff />
              {t('actionDeactivate')}
            </Button>
          )}
        </>
      )}

      <MemberEditDialog
        isOpen={isEditing}
        onOpenChange={setIsEditing}
        member={member}
        onSaved={onChanged}
      />

      <AlertDialog open={confirmDeactivate} onOpenChange={setConfirmDeactivate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deactivateTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deactivateDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBusy}>{t('editCancel')}</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={isBusy}
              onClick={() => changeStatus('deactivated')}
            >
              {isBusy && <Loader2 className="animate-spin" />}
              {t('deactivateConfirm')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmActivate} onOpenChange={setConfirmActivate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('activateTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('activateDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBusy}>{t('editCancel')}</AlertDialogCancel>
            <Button disabled={isBusy} onClick={() => changeStatus('active')}>
              {isBusy && <Loader2 className="animate-spin" />}
              {t('activateConfirm')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {link && (
        <LinkResultDialog
          isOpen
          onOpenChange={(open) => {
            if (!open) setLink(null);
          }}
          title={link.title}
          actionLink={link.actionLink}
        />
      )}
    </div>
  );
}
