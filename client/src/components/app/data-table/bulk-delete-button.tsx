'use client';

import { useState } from 'react';

import { Loader2, Trash2 } from 'lucide-react';

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

// Bulk-delete affordance for a DataTable selection bar. The caller's `onDelete`
// performs the deletion (and its own success/error toasts); this component owns
// the confirm dialog, loading state, and clearing the selection on success.
export function BulkDeleteButton({
  count,
  onDelete,
  onDone,
  triggerLabel,
  title,
  body,
  cancelLabel,
  confirmLabel,
}: {
  count: number;
  onDelete: () => Promise<void>;
  onDone: () => void;
  triggerLabel: string;
  title: string;
  body: string;
  cancelLabel: string;
  confirmLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onDelete();
      setOpen(false);
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        variant="destructive"
        size="xs"
        onClick={() => {
          setOpen(true);
        }}
      >
        <Trash2 />
        {triggerLabel} ({count})
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{body}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{cancelLabel}</AlertDialogCancel>
            <Button variant="destructive" disabled={busy} onClick={handleConfirm}>
              {busy && <Loader2 className="animate-spin" />}
              {confirmLabel}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
