"use client";

import { CalendarClock, ShieldAlert, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { FLAG_META, type DeviceFlag } from "@/lib/domain/devices";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  "shield-alert": ShieldAlert,
  "calendar-clock": CalendarClock,
};

export function FlagChip({ flag, className }: { flag: DeviceFlag; className?: string }) {
  const meta = FLAG_META[flag];
  const Icon = ICONS[meta.icon] ?? ShieldAlert;
  const t = useTranslations("devices.flag");
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 rounded-full px-2.5 text-xs font-medium leading-none whitespace-nowrap",
        "bg-[oklch(0.96_0.05_85)] text-[oklch(0.48_0.10_70)] dark:bg-[oklch(0.34_0.06_75)] dark:text-[oklch(0.84_0.12_85)]",
        className
      )}
    >
      <Icon className="size-3" aria-hidden />
      {t(flag)}
    </span>
  );
}
