import Link from "next/link";
import { Card } from "@/components/ui/card";
import { DEVICE_STATUSES, STATUS_COLOR, STATUS_META } from "@/lib/domain/devices";
import type { OverviewSummary } from "@/features/overview/api/get-overview-summary";

export function LifecycleCard({ data }: { data: OverviewSummary }) {
  const total = data.totalDevices;

  return (
    <Card className="shadow-none gap-0">
      <div className="px-5 pt-[18px] pb-0">
        <div className="text-[15px] font-semibold tracking-[-0.01em]">
          Lifecycle status
        </div>
        <div className="text-[12.5px] text-muted-foreground mt-0.5">
          Every device sits in exactly one state
        </div>
      </div>
      <div className="px-5 pt-[18px] pb-5">
        <div className="flex h-3 rounded-full overflow-hidden bg-muted mb-4">
          {total === 0
            ? null
            : DEVICE_STATUSES.map((k) => {
                const n = data.byStatus[k];
                if (!n) return null;
                return (
                  <span
                    key={k}
                    className="block h-full"
                    style={{
                      width: `${(n / total) * 100}%`,
                      background: STATUS_COLOR[k],
                    }}
                    aria-label={`${STATUS_META[k].label}: ${n}`}
                  />
                );
              })}
        </div>
        <div className="grid grid-cols-2 gap-x-[18px] gap-y-2.5">
          {DEVICE_STATUSES.map((k) => {
            const n = data.byStatus[k];
            const pct = total > 0 ? Math.round((n / total) * 100) : 0;
            return (
              <Link
                key={k}
                href={`/devices?status=${k}`}
                className="flex items-center gap-2.5 text-foreground hover:text-foreground"
              >
                <span
                  className="size-2.5 rounded-[3px] shrink-0"
                  style={{ background: STATUS_COLOR[k] }}
                  aria-hidden
                />
                <span className="text-[13px] flex-1">{STATUS_META[k].label}</span>
                <span className="text-[13px] font-semibold tabular-nums">{n}</span>
                <span className="text-xs text-muted-foreground w-[38px] text-right tabular-nums">
                  {pct}%
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
