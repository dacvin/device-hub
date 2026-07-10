import { Constants } from '@/types/database.types';

import type { CheckinOutcome, CheckoutStatus } from '../types/checkout';

export const CHECKOUT_PHOTOS_BUCKET = 'checkout-photos';

export const CHECKIN_OUTCOMES = Constants.public.Enums.checkin_outcome; // ['normal','consumed','other']

export const CHECKIN_OUTCOME_LABEL_KEY: Record<CheckinOutcome, string> = {
  normal: 'checkouts.outcomeNormal',
  consumed: 'checkouts.outcomeConsumed',
  other: 'checkouts.outcomeOther',
};

export const CHECKOUT_STATUS_LABEL_KEY: Record<CheckoutStatus, string> = {
  outstanding: 'checkouts.statusOutstanding',
  overdue: 'checkouts.statusOverdue',
  closed: 'checkouts.statusClosed',
};

export const CHECKOUT_SORTABLE_COLUMNS = [
  'checked_out_at',
  'borrower_name',
  'expected_return_date',
] as const;

// Local date (YYYY-MM-DD) for overdue comparison — matches DB `current_date`.
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// Pure: derive status from outstanding + expected return date.
export function checkoutStatus(
  outstanding: number,
  expectedReturnDate: string | null,
): CheckoutStatus {
  if (outstanding <= 0) return 'closed';
  if (expectedReturnDate && expectedReturnDate < todayIso()) return 'overdue';
  return 'outstanding';
}
