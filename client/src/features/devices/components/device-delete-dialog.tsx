'use client';

import { useRouter } from 'next/navigation';

import { Loader2 } from 'lucide-react';
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

import { useSoftDeleteDevice } from '../api/soft-delete-device';

export function DeviceDeleteDialog({
  deviceId,
  isOpen,
  onOpenChange,
}: {
  deviceId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('devices');
  const router = useRouter();
  const remove = useSoftDeleteDevice();

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(deviceId);
      toast.success(t('deletedToast'));
      onOpenChange(false);
      router.push('/devices');
    } catch {
      toast.error(t('deleteFailed'));
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('deleteConfirmBody')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={remove.isPending}>{t('cancel')}</AlertDialogCancel>
          <Button variant="destructive" disabled={remove.isPending} onClick={handleDelete}>
            {remove.isPending && <Loader2 className="animate-spin" />}
            {t('delete')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
