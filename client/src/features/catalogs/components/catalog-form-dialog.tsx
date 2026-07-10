'use client';

import type { ComponentType, ReactNode } from 'react';

import { useForm } from '@tanstack/react-form';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { AnyFieldApi } from '@tanstack/react-form';
import type { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Minimal structural view of a TanStack form for the renderFields render-prop.
export type CatalogFormApi = {
  Field: ComponentType<{ name: string; children: (field: AnyFieldApi) => ReactNode }>;
};

const FORM_ID = 'catalog-form-dialog';

export function CatalogFormDialog<TValues extends Record<string, unknown>>({
  isOpen,
  onOpenChange,
  title,
  schema,
  defaultValues,
  submit,
  renderFields,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- schema input may differ from TValues when transforms apply.
  schema: z.ZodType<TValues, any>;
  defaultValues: TValues;
  submit: (values: TValues) => Promise<unknown>;
  renderFields: (form: CatalogFormApi) => ReactNode;
}) {
  const t = useTranslations('catalogs');

  const form = useForm({
    defaultValues,
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      try {
        await submit(value);
        toast.success(t('savedToast'));
        onOpenChange(false);
      } catch (err) {
        const raw = err instanceof Error ? err.message : '';
        toast.error(raw === 'catalogs.duplicateName' ? t('duplicateName') : t('saveFailed'));
      }
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
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
          {renderFields(form)}
        </form>
        <DialogFooter>
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              onOpenChange(false);
            }}
          >
            {t('cancel')}
          </Button>
          <form.Subscribe
            selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}
          >
            {({ canSubmit, isSubmitting }) => (
              <Button type="submit" form={FORM_ID} disabled={!canSubmit || isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" />}
                {t('save')}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
