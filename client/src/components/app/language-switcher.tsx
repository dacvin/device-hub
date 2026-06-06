"use client";

import { Check, Globe } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOCALE_LABELS, SUPPORTED_LOCALES, isLocale, type Locale } from "@/lib/i18n/locales";
import { setLocale } from "@/lib/i18n/set-locale";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const active = useLocale();
  const router = useRouter();
  const [, startTransition] = useTransition();

  function choose(next: Locale) {
    setLocale(next, () => startTransition(() => router.refresh()));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="size-4" aria-hidden />
          <span className="text-sm">
            {isLocale(active) ? LOCALE_LABELS[active] : active}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {SUPPORTED_LOCALES.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onSelect={() => choose(loc)}
            className="flex items-center justify-between"
          >
            <span>{LOCALE_LABELS[loc]}</span>
            <Check className={cn("size-4", loc === active ? "opacity-100" : "opacity-0")} aria-hidden />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
