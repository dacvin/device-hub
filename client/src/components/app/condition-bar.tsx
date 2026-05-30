import { conditionTone } from "@/lib/domain/devices";
import { cn } from "@/lib/utils";

const TONE_FILL: Record<"success" | "warning" | "danger", string> = {
  success: "bg-[oklch(0.67_0.12_167)]",
  warning: "bg-[oklch(0.78_0.13_75)]",
  danger: "bg-destructive",
};

export function ConditionBar({
  value,
  showLabel = true,
  className,
}: {
  value: number;
  showLabel?: boolean;
  className?: string;
}) {
  const tone = conditionTone(value);
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      {showLabel && (
        <span className="text-xs font-medium tabular-nums w-9 text-right">{pct}%</span>
      )}
      <span className="inline-block h-1.5 w-14 rounded-full bg-muted overflow-hidden" aria-hidden>
        <span
          className={cn("block h-full rounded-full", TONE_FILL[tone])}
          style={{ width: `${pct}%` }}
        />
      </span>
    </div>
  );
}
