import { ThemeToggle } from "@/components/app/theme-toggle";

export function Topbar() {
  return (
    <div className="sticky top-0 z-30 h-14 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="h-full flex items-center justify-end gap-1 px-7">
        <ThemeToggle />
      </div>
    </div>
  );
}
