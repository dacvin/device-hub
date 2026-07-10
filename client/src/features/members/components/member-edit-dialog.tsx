'use client';

import { useForm } from '@tanstack/react-form';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { FieldError } from '@/lib/form/field-error';

import { updateMember } from '../actions/update-member';
import { updateMemberSchema } from '../validations/member';

import type { MemberDetail } from '../types/member';

const FORM_ID = 'member-edit-form';

export function MemberEditDialog({
  isOpen,
  onOpenChange,
  member,
  onSaved,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  member: MemberDetail;
  onSaved: () => void;
}) {
  const t = useTranslations('members');

  const form = useForm({
    defaultValues: { name: member.name, phone: member.phone ?? '' },
    validators: { onSubmit: updateMemberSchema },
    onSubmit: async ({ value }) => {
      try {
        await updateMember({ userId: member.id, data: value });
        toast.success(t('editSavedToast'));
        onSaved();
        onOpenChange(false);
      } catch {
        toast.error(t('editFailedToast'));
      }
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('editTitle')}</DialogTitle>
        </DialogHeader>
        <form
          id={FORM_ID}
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
                  <FieldLabel htmlFor={field.name}>{t('editNameLabel')}</FieldLabel>
                  <Input
                    id={field.name}
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
          <form.Field name="phone">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>{t('editPhoneLabel')}</FieldLabel>
                <Input
                  id={field.name}
                  type="tel"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                  }}
                />
              </Field>
            )}
          </form.Field>
        </form>
        <DialogFooter>
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              onOpenChange(false);
            }}
          >
            {t('editCancel')}
          </Button>
          <form.Subscribe
            selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}
          >
            {({ canSubmit, isSubmitting }) => (
              <Button type="submit" form={FORM_ID} disabled={!canSubmit || isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" />}
                {t('editSave')}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
