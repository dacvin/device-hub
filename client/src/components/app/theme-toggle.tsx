"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

function subscribe() {
  return () => {};
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations("common");
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-lg"
      aria-label={t("toggleTheme")}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-md bg-card hover:bg-accent dark:bg-card dark:hover:bg-accent"
    >
      {mounted ? (
        isDark ? <Sun className="size-[17px]" /> : <Moon className="size-[17px]" />
      ) : (
        <Sun className="size-[17px] opacity-0" />
      )}
    </Button>
  );
}
