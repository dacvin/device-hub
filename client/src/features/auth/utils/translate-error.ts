// A raw error string is a translation key iff it starts with one of our
// message namespaces. Anything else is a literal message shown as-is.
const KEY_PREFIXES = ['validation.', 'errors.'] as const;

export function isMessageKey(raw: string): boolean {
  return KEY_PREFIXES.some((prefix) => raw.startsWith(prefix));
}

// Extract + translate field errors from a form field's error array.
export function extractErrorMessage(errors: unknown[], t: (key: string) => string): string {
  return errors
    .map((e) => {
      const raw = typeof e === 'string' ? e : ((e as { message?: string }).message ?? '');
      return isMessageKey(raw) ? t(raw) : raw;
    })
    .join(', ');
}
