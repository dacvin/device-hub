import { STATUS_LABEL, STATUS_TONE, type DeviceStatus } from "@/lib/domain/devices";
import { cn } from "@/lib/utils";

const TONE_CLASSES: Record<"success" | "info" | "warning" | "muted", string> = {
  success:
    "bg-[oklch(0.94_0.05_160)] text-[oklch(0.42_0.07_175)] dark:bg-[oklch(0.32_0.05_170)] dark:text-[oklch(0.85_0.08_160)]",
  info: "bg-[oklch(0.94_0.02_240)] text-[oklch(0.42_0.05_240)] dark:bg-[oklch(0.30_0.04_240)] dark:text-[oklch(0.82_0.07_240)]",
  warning:
    "bg-[oklch(0.93_0.07_75)] text-[oklch(0.42_0.10_75)] dark:bg-[oklch(0.34_0.07_75)] dark:text-[oklch(0.82_0.10_75)]",
  muted: "bg-muted text-muted-foreground",
};

const DOT_CLASSES: Record<"success" | "info" | "warning" | "muted", string> = {
  success: "bg-[oklch(0.67_0.12_167)]",
  info: "bg-[oklch(0.55_0.10_240)]",
  warning: "bg-[oklch(0.78_0.13_75)]",
  muted: "bg-muted-foreground/60",
};

export function StatusBadge({ status, className }: { status: DeviceStatus; className?: string }) {
  const tone = STATUS_TONE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[tone],
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOT_CLASSES[tone])} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}
