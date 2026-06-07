import Link from "next/link";
import { Card } from "@/components/ui/card";

export interface LifecycleSegment {
  key: "in-use" | "in-storage" | "in-repair" | "retired";
  label: string;
  count: number;
  colorVar: string;
}

export function LifecycleBar({
  segments,
  total,
  title,
  subtitle,
}: {
  segments: LifecycleSegment[];
  total: number;
  title: string;
  subtitle: string;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between px-5 pt-[18px] pb-0">
        <div>
          <div className="text-[15px] font-semibold tracking-tight">{title}</div>
          <div className="text-[12.5px] text-muted-foreground mt-0.5">{subtitle}</div>
        </div>
      </div>
      <div className="px-5 pt-[18px] pb-5">
        <div className="flex h-3 rounded-full overflow-hidden bg-muted mb-4">
          {segments.map((s) => (
            <div
              key={s.key}
              className="h-full"
              style={{
                width: total ? `${(s.count / total) * 100}%` : 0,
                backgroundColor: `var(${s.colorVar})`,
              }}
              aria-label={`${s.label}: ${s.count}`}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-x-[18px] gap-y-[10px]">
          {segments.map((s) => {
            const pct = total ? Math.round((s.count / total) * 100) : 0;
            return (
              <Link
                key={s.key}
                href={`/devices?status=${s.key}`}
                className="flex items-center gap-[9px]"
                style={{ color: "inherit" }}
              >
                <span
                  className="size-[10px] rounded-[3px] flex-none"
                  style={{ backgroundColor: `var(${s.colorVar})` }}
                  aria-hidden
                />
                <span className="text-[13px] flex-1">{s.label}</span>
                <span className="text-[13px] font-semibold tabular-nums">{s.count}</span>
                <span className="text-[12px] text-muted-foreground tabular-nums w-[38px] text-right">{pct}%</span>
              </Link>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
