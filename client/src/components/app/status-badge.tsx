import { cn } from "@/lib/utils";
import { STATUS_META, type DeviceStatus } from "@/lib/domain/devices";

const TONE_CLASS: Record<string, string> = {
  success:
    "bg-[oklch(0.93_0.05_160)] text-[oklch(0.32_0.06_170)] dark:bg-[oklch(0.30_0.05_170)] dark:text-[oklch(0.85_0.08_160)]",
  info: "bg-[oklch(0.93_0.04_230)] text-[oklch(0.36_0.08_240)] dark:bg-[oklch(0.28_0.05_230)] dark:text-[oklch(0.83_0.09_230)]",
  warning:
    "bg-[oklch(0.96_0.05_85)] text-[oklch(0.48_0.10_70)] dark:bg-[oklch(0.34_0.06_75)] dark:text-[oklch(0.84_0.12_85)]",
  muted: "bg-muted text-muted-foreground",
  danger:
    "bg-[oklch(0.95_0.04_25)] text-[oklch(0.45_0.18_25)] dark:bg-[oklch(0.32_0.06_25)] dark:text-[oklch(0.82_0.13_25)]",
};

const DOT_COLOR: Record<DeviceStatus, string> = {
  "in-use": "oklch(0.6749 0.1199 167.66)", // green-500
  storage: "oklch(0.70 0.10 230)",
  repair: "oklch(0.78 0.13 75)",
  retired: "var(--muted-foreground)",
};

export function StatusBadge({ status }: { status: DeviceStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-[3px] text-[11.5px] font-medium leading-none whitespace-nowrap",
        TONE_CLASS[meta.tone],
      )}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ background: DOT_COLOR[status] }}
        aria-hidden
      />
      {meta.label}
    </span>
  );
}
