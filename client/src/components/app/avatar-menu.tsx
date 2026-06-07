"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CircleUser, Settings, LogOut, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export interface AvatarMenuUser {
  id: string;
  name: string;
  email: string;
  initials: string;
}

export function AvatarMenu({ user }: { user: AvatarMenuUser }) {
  const t = useTranslations("avatarMenu");
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-md p-2 hover:bg-sidebar-accent text-left"
        >
          <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
            {user.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium leading-tight truncate">{user.name}</div>
            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="text-sm font-medium leading-tight">{user.name}</div>
          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/members/${user.id}`}>
            <CircleUser className="size-4" aria-hidden />
            {t("viewProfile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="size-4" aria-hidden />
            {t("accountSettings")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
          {theme === "dark" ? t("lightMode") : t("darkMode")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut}>
          <LogOut className="size-4" aria-hidden />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
