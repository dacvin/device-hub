'use client';

import type { ReactNode } from 'react';

import { useForm } from '@tanstack/react-form';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { AnyFieldApi } from '@tanstack/react-form';
import type { z } from 'zod';

import { DatePicker } from '@/components/app/date-picker';
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
import { Textarea } from '@/components/ui/textarea';
import { useDeviceMedia } from '@/features/devices/components/use-device-media';
import { FieldError } from '@/lib/form/field-error';

import { useCreateCheckout } from '../api/create-checkout';
import { CHECKOUT_FORM_DEFAULTS, checkoutFormSchema } from '../validations/checkout';
import { CheckoutPhotosField } from './checkout-photos-field';

import type { CheckoutFormValues } from '../validations/checkout';

const FORM_ID = 'checkout-form-dialog';

// AnyFieldApi types `name`/`state.value` as `any`; read them as definite strings.
const fieldText = (v: unknown): string => (typeof v === 'string' ? v : '');
const fieldId = (name: unknown): string => String(name);

function FieldRow({
  field,
  label,
  required,
  children,
}: {
  field: AnyFieldApi;
  label: string;
  required?: boolean;
  children: (isInvalid: boolean) => ReactNode;
}) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={fieldId(field.name)}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      {children(isInvalid)}
      <FieldError errors={field.state.meta.errors} />
    </Field>
  );
}

function TextControl({
  field,
  isInvalid,
  type = 'text',
  min,
  max,
}: {
  field: AnyFieldApi;
  isInvalid: boolean;
  type?: string;
  min?: number;
  max?: number;
}) {
  return (
    <Input
      id={fieldId(field.name)}
      name={fieldId(field.name)}
      type={type}
      min={min}
      max={max}
      value={fieldText(field.state.value)}
      onBlur={field.handleBlur}
      onChange={(e) => {
        field.handleChange(e.target.value);
      }}
      aria-invalid={isInvalid}
    />
  );
}

export function CheckoutDialog({
  deviceId,
  deviceName,
  available,
  open,
  onOpenChange,
}: {
  deviceId: string;
  deviceName: string;
  available: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('checkouts');
  const photos = useDeviceMedia([], { withPreview: true });
  const createCheckout = useCreateCheckout();

  const form = useForm({
    defaultValues: CHECKOUT_FORM_DEFAULTS,
    validators: {
      onSubmit: checkoutFormSchema as unknown as z.ZodType<CheckoutFormValues, CheckoutFormValues>,
    },
    onSubmit: async ({ value }) => {
      try {
        await createCheckout.mutateAsync({ deviceId, values: value, photos: photos.entries });
        toast.success(t('checkedOut'));
        onOpenChange(false);
        form.reset();
        photos.reset([]);
      } catch {
        toast.error(t('checkoutFailed'));
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('checkOutTitle', { deviceName })}</DialogTitle>
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
          <form.Field name="borrowerName">
            {(field) => (
              <FieldRow field={field} label={t('fieldBorrower')} required>
                {(isInvalid) => <TextControl field={field} isInvalid={isInvalid} />}
              </FieldRow>
            )}
          </form.Field>

          <form.Field name="quantity">
            {(field) => (
              <FieldRow field={field} label={t('fieldQuantity')} required>
                {(isInvalid) => (
                  <>
                    <TextControl
                      field={field}
                      isInvalid={isInvalid}
                      type="number"
                      min={1}
                      max={available}
                    />
                    <p className="text-muted-foreground text-xs">
                      {t('availableCount', { count: available })}
                    </p>
                  </>
                )}
              </FieldRow>
            )}
          </form.Field>

          <form.Field name="expectedReturnDate">
            {(field) => (
              <FieldRow field={field} label={t('fieldExpectedReturn')}>
                {(isInvalid) => (
                  <DatePicker
                    id={fieldId(field.name)}
                    value={fieldText(field.state.value)}
                    onChange={(v) => {
                      field.handleChange(v);
                    }}
                    placeholder={t('empty')}
                    ariaInvalid={isInvalid}
                  />
                )}
              </FieldRow>
            )}
          </form.Field>

          <div className="space-y-3">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {t('photosLabel')}
            </p>
            <CheckoutPhotosField media={photos} />
          </div>

          <form.Field name="notes">
            {(field) => (
              <FieldRow field={field} label={t('fieldNotes')}>
                {(isInvalid) => (
                  <Textarea
                    id={fieldId(field.name)}
                    value={fieldText(field.state.value)}
                    onBlur={field.handleBlur}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                    }}
                    aria-invalid={isInvalid}
                  />
                )}
              </FieldRow>
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
            {t('cancel')}
          </Button>
          <form.Subscribe
            selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}
          >
            {({ canSubmit, isSubmitting }) => (
              <Button
                type="submit"
                form={FORM_ID}
                disabled={available <= 0 || !canSubmit || isSubmitting}
              >
                {isSubmitting && <Loader2 className="animate-spin" />}
                {t('checkOut')}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
