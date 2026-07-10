'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { useLocale, useTranslations } from 'next-intl';

import { setLocale } from '@/lib/set-locale';
import { cn } from '@/lib/utils';

const LOCALES = ['en', 'vi'] as const;

/** Compact EN/VI segmented toggle for public (auth) pages. */
export function LocaleSwitcher() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('localeSwitcher');
  const [isPending, startTransition] = useTransition();

  function switchTo(next: string) {
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label={t('label')}
      className="bg-muted/60 inline-flex items-center rounded-md border p-0.5"
    >
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          disabled={isPending}
          onClick={() => {
            switchTo(code);
          }}
          aria-pressed={locale === code}
          className={cn(
            'rounded-[5px] px-2.5 py-1 text-xs font-medium transition-colors',
            'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
            locale === code
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {t(code)}
        </button>
      ))}
    </div>
  );
}
