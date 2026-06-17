import { conditionColor } from "@/lib/domain/devices";
import { cn } from "@/lib/utils";

interface ConditionBarProps {
  condition: number;
  className?: string;
  showLabel?: boolean;
}

export function ConditionBar({
  condition,
  className,
  showLabel = true,
}: ConditionBarProps) {
  const color = conditionColor(condition);
  return (
    <div className={cn("flex items-center gap-2 min-w-0", className)}>
      {showLabel ? (
        <span className="text-[12.5px] font-semibold tabular-nums w-9 text-right shrink-0">
          {condition}%
        </span>
      ) : null}
      <span className="block h-1.5 rounded-full bg-muted overflow-hidden flex-1 min-w-12 max-w-[88px]">
        <span
          className="block h-full rounded-full"
          style={{ width: `${condition}%`, background: color }}
        />
      </span>
    </div>
  );
}
