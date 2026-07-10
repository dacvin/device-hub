'use client';

import { useState } from 'react';

import { useForm } from '@tanstack/react-form';
import { Check, Copy, Loader2, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { inviteUser } from '@/features/auth/actions/invite-user';
import { isMessageKey } from '@/features/auth/utils/translate-error';
import { inviteSchema } from '@/features/auth/validations/auth';
import { FieldError } from '@/lib/form/field-error';

function InviteForm({ onSuccess }: { onSuccess: (link: string) => void }) {
  const t = useTranslations();

  const form = useForm({
    defaultValues: { name: '', email: '' },
    validators: { onSubmit: inviteSchema },
    onSubmit: async ({ value }) => {
      try {
        const { actionLink } = await inviteUser(value);
        onSuccess(actionLink);
      } catch (err) {
        const raw = err instanceof Error ? err.message : '';
        toast.error(isMessageKey(raw) ? t(raw) : t('invite.failedToast'));
      }
    },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('invite.formTitle')}</DialogTitle>
        <DialogDescription>{t('invite.formSubtitle')}</DialogDescription>
      </DialogHeader>

      <form
        id="invite-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
        className="space-y-4 py-2"
      >
        <form.Field name="name">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>{t('invite.nameLabel')}</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder={t('invite.namePlaceholder')}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                  }}
                  aria-invalid={isInvalid}
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="email">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>{t('invite.emailLabel')}</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  placeholder={t('invite.emailPlaceholder')}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                  }}
                  aria-invalid={isInvalid}
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            );
          }}
        </form.Field>
      </form>

      <DialogFooter>
        <form.Subscribe
          selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button type="submit" form="invite-form" disabled={!canSubmit || isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {t('invite.sendButton')}
            </Button>
          )}
        </form.Subscribe>
      </DialogFooter>
    </>
  );
}

function InviteResult({ actionLink }: { actionLink: string }) {
  const t = useTranslations();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(actionLink);
    setCopied(true);
    toast.success(t('invite.copiedToast'));
    window.setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('invite.resultTitle')}</DialogTitle>
        <DialogDescription>{t('invite.inviteNote')}</DialogDescription>
      </DialogHeader>

      <Field className="py-2">
        <FieldLabel htmlFor="invite-link">{t('invite.inviteLinkLabel')}</FieldLabel>
        <div className="flex items-center gap-2">
          <Input
            id="invite-link"
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
            onClick={copy}
            aria-label={t('invite.copyButton')}
          >
            {copied ? <Check className="text-primary" /> : <Copy />}
          </Button>
        </div>
      </Field>
    </>
  );
}

export function InviteDialog() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [actionLink, setActionLink] = useState<string | null>(null);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setActionLink(null); // reset to form phase on close
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus />
          {t('invite.triggerButton')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {actionLink === null ? (
          <InviteForm onSuccess={setActionLink} />
        ) : (
          <InviteResult actionLink={actionLink} />
        )}
      </DialogContent>
    </Dialog>
  );
}
