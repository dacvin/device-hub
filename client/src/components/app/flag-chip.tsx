"use client";

import { CalendarClock, ShieldAlert, type LucideIcon } from "lucide-react";
import { FLAG_META, type DeviceFlag } from "@/lib/domain/devices";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  "shield-alert": ShieldAlert,
  "calendar-clock": CalendarClock,
};

export function FlagChip({ flag, className }: { flag: DeviceFlag; className?: string }) {
  const meta = FLAG_META[flag];
  const Icon = ICONS[meta.icon] ?? ShieldAlert;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
        "bg-[oklch(0.95_0.05_75)] text-[oklch(0.45_0.10_75)] dark:bg-[oklch(0.32_0.07_75)] dark:text-[oklch(0.82_0.10_75)]",
        className
      )}
    >
      <Icon className="size-3" aria-hidden />
      {meta.label}
    </span>
  );
}
