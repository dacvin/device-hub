import { CalendarClock, ShieldAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { FLAG_META, type DeviceFlag } from "@/lib/domain/devices";

const ICON_MAP: Record<DeviceFlag, LucideIcon> = {
  warranty: ShieldAlert,
  inventory: CalendarClock,
};

interface FlagChipProps {
  flag: DeviceFlag;
  /** When true, hide the text label and render an icon-only chip with a tooltip. */
  iconOnly?: boolean;
  className?: string;
}

export function FlagChip({ flag, iconOnly, className }: FlagChipProps) {
  const meta = FLAG_META[flag];
  const Icon = ICON_MAP[flag];
  return (
    <span
      title={iconOnly ? meta.label : undefined}
      className={cn(
        "inline-flex items-center gap-1 rounded-full text-[11px] font-medium",
        "bg-[oklch(0.96_0.05_85)] text-[oklch(0.48_0.10_70)] dark:bg-[oklch(0.34_0.06_75)] dark:text-[oklch(0.84_0.12_85)]",
        iconOnly ? "size-[26px] justify-center" : "px-2 py-[3px]",
        className,
      )}
    >
      <Icon className="size-3" aria-hidden />
      {!iconOnly ? meta.label : null}
    </span>
  );
}

export function FlagChipsRow({
  flags,
  iconOnly,
  empty = "—",
}: {
  flags: DeviceFlag[];
  iconOnly?: boolean;
  empty?: string;
}) {
  if (flags.length === 0) {
    return <span className="text-muted-foreground text-[12.5px]">{empty}</span>;
  }
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {flags.map((f) => (
        <FlagChip key={f} flag={f} iconOnly={iconOnly} />
      ))}
    </div>
  );
}
