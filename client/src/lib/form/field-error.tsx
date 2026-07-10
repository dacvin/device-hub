'use client';

import { useTranslations } from 'next-intl';

import { FieldError as ShadcnFieldError } from '@/components/ui/field';

// A raw error string is a translation key iff it starts with one of our
// message namespaces; anything else is a literal message shown as-is.
const MESSAGE_KEY_PREFIXES = ['validation.', 'errors.'] as const;

function isMessageKey(raw: string): boolean {
  return MESSAGE_KEY_PREFIXES.some((prefix) => raw.startsWith(prefix));
}

type FieldIssue = { message?: string } | string | undefined | null;

/**
 * i18n-aware wrapper around shadcn's <FieldError>.
 *
 * This app's zod schemas set `message` to translation *keys*
 * (e.g. `validation.emailInvalid`), but shadcn's <FieldError> renders raw
 * `.message` text. This wrapper translates keys → localized strings via
 * next-intl, then delegates to shadcn's renderer so we keep its dedup +
 * single/multi list behavior. Pass `field.state.meta.errors` straight in.
 */
export function FieldError({ errors }: { errors?: readonly FieldIssue[] }) {
  const t = useTranslations();
  if (!errors?.length) return null;

  const translated = errors
    .map((e) => {
      const raw = typeof e === 'string' ? e : (e?.message ?? '');
      if (!raw) return null;
      return { message: isMessageKey(raw) ? t(raw) : raw };
    })
    .filter((e): e is { message: string } => e !== null);

  if (!translated.length) return null;

  return <ShadcnFieldError errors={translated} />;
}
