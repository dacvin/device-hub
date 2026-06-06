"use client";

import { LOCALE_COOKIE, isLocale, type Locale } from "@/lib/i18n/locales";

// Writes the locale cookie and reloads route data so server components
// re-render with the new locale's messages.
export function setLocale(next: Locale, refresh: () => void): void {
  if (!isLocale(next)) return;
  // 1 year, site-wide, Lax — locale isn't sensitive enough for Strict.
  document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  refresh();
}
