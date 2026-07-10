import { z } from 'zod';

import { CHECKIN_OUTCOMES } from '../constants/checkout';

const nullableText = z.string().trim().catch('');
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'validation.dateInvalid' })
  .or(z.literal(''))
  .catch('');
// condition lives as '' (unset) or a 0–100 int in the form.
const optionalCondition = z
  .union([z.literal(''), z.coerce.number().int().min(0).max(100)])
  .catch('');

export const checkoutFormSchema = z.object({
  borrowerName: z.string().trim().min(1, { message: 'validation.borrowerRequired' }),
  quantity: z.coerce.number().int().min(1, { message: 'validation.quantityMin' }),
  expectedReturnDate: dateString,
  notes: nullableText,
});
export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
export const CHECKOUT_FORM_DEFAULTS: CheckoutFormValues = {
  borrowerName: '',
  quantity: 1,
  expectedReturnDate: '',
  notes: '',
};

export const checkInFormSchema = z
  .object({
    outcome: z.enum(CHECKIN_OUTCOMES),
    quantity: z.coerce.number().int().min(1, { message: 'validation.quantityMin' }),
    condition: optionalCondition,
    notes: nullableText,
    split: z.boolean().catch(false),
    splitCode: nullableText,
  })
  // condition + split only apply to 'normal'
  .refine((v) => v.outcome === 'normal' || (v.condition === '' && !v.split), {
    message: 'validation.checkinOutcomeShape',
    path: ['outcome'],
  });
export type CheckInFormValues = z.infer<typeof checkInFormSchema>;
export const CHECK_IN_FORM_DEFAULTS: CheckInFormValues = {
  outcome: 'normal',
  quantity: 1,
  condition: '',
  notes: '',
  split: false,
  splitCode: '',
};
