"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/locales";
import { setLocale } from "@/lib/i18n/set-locale";
import { cn } from "@/lib/utils";

export function LoginLanguageSwitcher() {
  const active = useLocale();
  const router = useRouter();
  const [, startTransition] = useTransition();

  function choose(next: Locale) {
    setLocale(next, () => startTransition(() => router.refresh()));
  }

  return (
    <div className="inline-flex items-center gap-1 text-xs">
      {SUPPORTED_LOCALES.map((loc, i) => (
        <span key={loc} className="contents">
          {i > 0 && <span className="text-muted-foreground/60">·</span>}
          <button
            type="button"
            onClick={() => choose(loc)}
            className={cn(
              "px-1 py-0.5 rounded transition-colors",
              loc === active
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={loc === active}
          >
            {LOCALE_LABELS[loc]}
          </button>
        </span>
      ))}
    </div>
  );
}
