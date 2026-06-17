"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useTransition } from "react";
import { ChevronsUpDown, CircleUser, LogOut, Sun, Moon, Globe, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { LOCALE_LABELS, SUPPORTED_LOCALES, isLocale, type Locale } from "@/lib/i18n/locales";
import { setLocale } from "@/lib/i18n/set-locale";
import { useConfirm } from "@/hooks/use-confirm";
import { cn } from "@/lib/utils";

export interface AvatarMenuUser {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
}

interface AvatarMenuProps {
  user: AvatarMenuUser;
  variant?: "chip" | "icon";
}

export function AvatarMenu({ user, variant = "chip" }: AvatarMenuProps) {
  const t = useTranslations("avatarMenu");
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const active = useLocale();
  const [, startTransition] = useTransition();
  const confirm = useConfirm();

  async function handleSignOut() {
    const ok = await confirm({
      title: t("signOutConfirmTitle"),
      description: t("signOutConfirmDesc"),
      confirmLabel: t("signOut"),
      tone: "warn",
    });
    if (!ok) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  function chooseLocale(next: Locale) {
    setLocale(next, () => startTransition(() => router.refresh()));
  }

  const trigger =
    variant === "icon" ? (
      <button
        type="button"
        className="size-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold shadow"
        aria-label="Account menu"
      >
        {user.initials}
      </button>
    ) : (
      <button
        type="button"
        className="flex w-full items-center gap-2.5 rounded-md p-2 hover:bg-sidebar-accent text-left"
      >
        <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold shrink-0">
          {user.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium leading-tight truncate">{user.name}</div>
          <div className="text-xs text-muted-foreground truncate">{user.role}</div>
        </div>
        <ChevronsUpDown className="size-4 text-muted-foreground shrink-0" aria-hidden />
      </button>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        side={variant === "icon" ? "bottom" : "top"}
        align={variant === "icon" ? "end" : "start"}
        className="w-64"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold shrink-0">
              {user.initials}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium leading-tight">{user.name}</div>
              <div className="text-xs text-muted-foreground truncate font-mono">{user.email}</div>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <CircleUser className="size-4" aria-hidden />
            {t("viewProfile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Globe className="size-4" aria-hidden />
            {t("language")}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {SUPPORTED_LOCALES.map((loc) => (
              <DropdownMenuItem
                key={loc}
                onSelect={() => chooseLocale(loc)}
                className="flex items-center justify-between"
              >
                <span>{LOCALE_LABELS[loc]}</span>
                <Check
                  className={cn("size-4", isLocale(active) && loc === active ? "opacity-100" : "opacity-0")}
                  aria-hidden
                />
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem onSelect={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
          {theme === "dark" ? t("lightMode") : t("darkMode")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            void handleSignOut();
          }}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" aria-hidden />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
