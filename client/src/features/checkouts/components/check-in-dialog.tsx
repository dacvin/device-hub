'use client';

import { type ReactNode, useEffect } from 'react';

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
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useNextDeviceCode } from '@/features/devices/api/get-next-device-code';
import { useDeviceMedia } from '@/features/devices/components/use-device-media';
import { FieldError } from '@/lib/form/field-error';
import { cn } from '@/lib/utils';

import { useCheckIn } from '../api/check-in';
import { CHECKIN_OUTCOME_LABEL_KEY, CHECKIN_OUTCOMES } from '../constants/checkout';
import { CHECK_IN_FORM_DEFAULTS, checkInFormSchema } from '../validations/checkout';
import { CheckoutPhotosField } from './checkout-photos-field';

import type { CheckinOutcome, CheckoutWithDetail } from '../types/checkout';
import type { CheckInFormValues } from '../validations/checkout';

const FORM_ID = 'check-in-form-dialog';

const OUTCOME_DESCRIPTOR_KEY: Record<(typeof CHECKIN_OUTCOMES)[number], string> = {
  normal: 'outcomeNormalDescriptor',
  consumed: 'outcomeConsumedDescriptor',
  other: 'outcomeOtherDescriptor',
  lost: 'outcomeLostDescriptor',
};

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

// Fetches the next DEV-### suggestion once split turns on, and seeds it into
// splitCode the first time (still always editable). A dedicated component so
// its hooks stay unconditional regardless of how the parent renders it.
function SplitCodePrefill({
  split,
  splitCode,
  onSuggestion,
}: {
  split: boolean;
  splitCode: string;
  onSuggestion: (code: string) => void;
}) {
  const nextCode = useNextDeviceCode({ enabled: split });

  useEffect(() => {
    if (split && splitCode === '' && nextCode.data) {
      onSuggestion(nextCode.data);
    }
  }, [split, splitCode, nextCode.data, onSuggestion]);

  return null;
}

// Forces split back off when its preconditions vanish (quantity raised to the
// device's full stock, or outcome changed) so a stale hidden toggle can never
// reach the RPC. Hook lives in its own component to stay unconditional.
function SplitOff({ split, onOff }: { split: boolean; onOff: () => void }) {
  useEffect(() => {
    if (split) onOff();
  }, [split, onOff]);
  return null;
}

// Reveal wrapper always renders; only its height animates via grid-template-rows.
function Reveal({
  open,
  fast,
  className,
  children,
}: {
  open: boolean;
  fast?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'grid transition-[grid-template-rows] ease-out',
        fast ? 'duration-[120ms]' : 'duration-150',
        className,
      )}
      style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

export function CheckInDialog({
  checkout,
  open,
  onOpenChange,
}: {
  checkout: CheckoutWithDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('checkouts');
  // CHECKIN_OUTCOME_LABEL_KEY stores fully-qualified keys (`checkouts.outcomeNormal`).
  const tRoot = useTranslations();
  const photos = useDeviceMedia([], { withPreview: true });
  const checkIn = useCheckIn();

  const form = useForm({
    defaultValues: CHECK_IN_FORM_DEFAULTS,
    validators: {
      onSubmit: checkInFormSchema as unknown as z.ZodType<CheckInFormValues, CheckInFormValues>,
    },
    onSubmit: async ({ value }) => {
      try {
        await checkIn.mutateAsync({
          checkoutId: checkout.id,
          deviceId: checkout.deviceId,
          values: value,
          photos: photos.entries,
        });
        toast.success(t('checkedIn'));
        onOpenChange(false);
        form.reset();
        photos.reset([]);
      } catch {
        toast.error(t('checkInFailed'));
      }
    },
  });

  const validateQuantity = ({ value }: { value: unknown }) =>
    Number(value) > checkout.outstanding ? 'validation.checkinExceedsOutstanding' : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('checkInTitle', { deviceName: checkout.deviceName })}</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">
          {t.rich('outstandingMeta', {
            outstanding: checkout.outstanding,
            quantity: checkout.quantity,
            num: (chunks) => <span className="font-mono tabular-nums">{chunks}</span>,
          })}
        </p>
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
          <form.Field name="outcome">
            {(field) => (
              <Field>
                <FieldLabel>{t('fieldOutcome')}</FieldLabel>
                <RadioGroup
                  value={fieldText(field.state.value)}
                  onValueChange={(v) => {
                    field.handleChange(v as CheckinOutcome);
                  }}
                  className="grid grid-cols-2 gap-2"
                >
                  {CHECKIN_OUTCOMES.map((outcome) => {
                    const selected = field.state.value === outcome;
                    return (
                      <Label
                        key={outcome}
                        htmlFor={`outcome-${outcome}`}
                        className={cn(
                          'flex cursor-pointer flex-col gap-1 rounded-lg border p-2.5 text-left font-normal',
                          selected
                            ? 'border-primary bg-accent text-accent-foreground'
                            : 'border-input',
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <RadioGroupItem value={outcome} id={`outcome-${outcome}`} />
                          <span className="text-sm font-medium">
                            {tRoot(CHECKIN_OUTCOME_LABEL_KEY[outcome])}
                          </span>
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {t(OUTCOME_DESCRIPTOR_KEY[outcome])}
                        </span>
                      </Label>
                    );
                  })}
                </RadioGroup>
              </Field>
            )}
          </form.Field>

          <form.Field
            name="quantity"
            validators={{ onChange: validateQuantity, onSubmit: validateQuantity }}
          >
            {(field) => (
              <FieldRow field={field} label={t('fieldQuantity')} required>
                {(isInvalid) => (
                  <TextControl
                    field={field}
                    isInvalid={isInvalid}
                    type="number"
                    min={1}
                    max={checkout.outstanding}
                  />
                )}
              </FieldRow>
            )}
          </form.Field>

          <form.Subscribe
            selector={(s) => ({ outcome: s.values.outcome, quantity: s.values.quantity })}
          >
            {({ outcome, quantity }) => {
              // splitting is accessories-only and must leave the parent with
              // stock (splitting everything would just rename the record)
              const splitAllowed =
                checkout.deviceType === 'accessory' && quantity < checkout.deviceQuantity;
              return (
                <Reveal open={outcome === 'normal'} className="-my-2">
                  <div className="space-y-4 py-2">
                    <form.Field name="condition">
                      {(field) => (
                        <FieldRow field={field} label={t('fieldCondition')}>
                          {(isInvalid) => (
                            <TextControl
                              field={field}
                              isInvalid={isInvalid}
                              type="number"
                              min={0}
                              max={100}
                            />
                          )}
                        </FieldRow>
                      )}
                    </form.Field>

                    {splitAllowed ? (
                      <>
                        <form.Field name="split">
                          {(field) => (
                            <Field orientation="horizontal">
                              <FieldLabel htmlFor={fieldId(field.name)}>
                                {t('fieldSplit')}
                              </FieldLabel>
                              <Switch
                                id={fieldId(field.name)}
                                checked={field.state.value}
                                onCheckedChange={(checked) => {
                                  field.handleChange(checked);
                                }}
                              />
                            </Field>
                          )}
                        </form.Field>

                        <form.Subscribe
                          selector={(s) => ({
                            split: s.values.split,
                            splitCode: s.values.splitCode,
                          })}
                        >
                          {({ split, splitCode }) => (
                            <>
                              <SplitCodePrefill
                                split={split}
                                splitCode={splitCode}
                                onSuggestion={(code) => {
                                  form.setFieldValue('splitCode', code);
                                }}
                              />
                              <Reveal open={split} fast className="ml-1 border-l pl-4">
                                <div className="py-2">
                                  <form.Field name="splitCode">
                                    {(field) => (
                                      <FieldRow field={field} label={t('fieldSplitCode')}>
                                        {(isInvalid) => (
                                          <TextControl field={field} isInvalid={isInvalid} />
                                        )}
                                      </FieldRow>
                                    )}
                                  </form.Field>
                                </div>
                              </Reveal>
                            </>
                          )}
                        </form.Subscribe>
                      </>
                    ) : (
                      <form.Subscribe selector={(s) => s.values.split}>
                        {(split) => (
                          <SplitOff
                            split={split}
                            onOff={() => {
                              form.setFieldValue('split', false);
                            }}
                          />
                        )}
                      </form.Subscribe>
                    )}
                  </div>
                </Reveal>
              );
            }}
          </form.Subscribe>

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
              <Button type="submit" form={FORM_ID} disabled={!canSubmit || isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" />}
                {t('checkIn')}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
