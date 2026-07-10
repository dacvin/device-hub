'use client';

import { useState } from 'react';

import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { IconButton } from '@/components/app/icon-button';
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

import { CatalogInUseError } from '../utils/in-use-guard';

export function CatalogRowActions({
  name,
  onEdit,
  onDelete,
}: {
  name: string;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}) {
  const t = useTranslations('catalogs');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirm() {
    setIsDeleting(true);
    try {
      await onDelete();
      toast.success(t('deletedToast'));
      setConfirmOpen(false);
    } catch (error) {
      if (error instanceof CatalogInUseError) {
        toast.error(t('deleteInUse', { count: error.count }));
      } else {
        toast.error(t('deleteFailed'));
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <IconButton
        label={t('edit')}
        variant="ghost"
        size="icon-sm"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
      >
        <Pencil />
      </IconButton>
      <IconButton
        label={t('delete')}
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation();
          setConfirmOpen(true);
        }}
      >
        <Trash2 />
      </IconButton>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirmTitle', { name })}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirmBody')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('cancel')}</AlertDialogCancel>
            <Button variant="destructive" disabled={isDeleting} onClick={handleConfirm}>
              {isDeleting && <Loader2 className="animate-spin" />}
              {t('delete')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
