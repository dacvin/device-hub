'use client';

import { useState } from 'react';

import { Check, Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export function LinkResultDialog({
  isOpen,
  onOpenChange,
  title,
  actionLink,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  actionLink: string;
}) {
  const t = useTranslations('members');
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(actionLink);
    setCopied(true);
    toast.success(t('linkCopiedToast'));
    window.setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{t('linkNote')}</DialogDescription>
        </DialogHeader>
        <Field className="py-2">
          <FieldLabel htmlFor="member-link">{t('linkLabel')}</FieldLabel>
          <div className="flex items-center gap-2">
            <Input
              id="member-link"
              readOnly
              value={actionLink}
              className="font-mono text-xs tracking-[-0.01em] tabular-nums"
              onFocus={(e) => {
                e.currentTarget.select();
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              aria-label={t('linkCopy')}
              onClick={copy}
            >
              {copied ? <Check className="text-primary" /> : <Copy />}
            </Button>
          </div>
        </Field>
      </DialogContent>
    </Dialog>
  );
}
