"use client";

import { useTranslations } from "next-intl";
import { STATUS_TONE, type DeviceStatus } from "@/lib/domain/devices";
import { cn } from "@/lib/utils";

const TONE_CLASSES: Record<"success" | "info" | "warning" | "muted", string> = {
  success:
    "bg-[color-mix(in_oklch,var(--green-200)_55%,var(--card))] text-[var(--green-900)] dark:bg-[color-mix(in_oklch,var(--green-800)_40%,var(--card))] dark:text-[var(--green-300)]",
  info: "bg-[oklch(0.95_0.03_215)] text-[oklch(0.50_0.10_230)] dark:bg-[oklch(0.32_0.06_230)] dark:text-[oklch(0.82_0.09_220)]",
  warning:
    "bg-[oklch(0.96_0.05_85)] text-[oklch(0.48_0.10_70)] dark:bg-[oklch(0.34_0.06_75)] dark:text-[oklch(0.84_0.12_85)]",
  muted: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status, className }: { status: DeviceStatus; className?: string }) {
  const tone = STATUS_TONE[status];
  const t = useTranslations("devices.status");
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 rounded-full px-2.5 text-xs font-medium leading-none whitespace-nowrap",
        TONE_CLASSES[tone],
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {t(status)}
    </span>
  );
}
