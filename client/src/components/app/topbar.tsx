import { LanguageSwitcher } from "@/components/app/language-switcher";
import { ThemeToggle } from "@/components/app/theme-toggle";

export function Topbar() {
  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/[0.86] backdrop-blur">
      <div className="flex items-center justify-end gap-2.5 px-7 py-3.5">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </div>
  );
}
