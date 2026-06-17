import Link from "next/link";
import { CalendarClock, ShieldAlert, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { FLAG_META, type DeviceFlag } from "@/lib/domain/devices";
import { GroupIconTile } from "./group-icon-tile";
import type { OverviewSummary } from "@/features/overview/api/get-overview-summary";

const FLAG_ICON: Record<DeviceFlag, LucideIcon> = {
  warranty: ShieldAlert,
  inventory: CalendarClock,
};

export function AttentionCard({ data }: { data: OverviewSummary }) {
  const { flaggedDevices, inRepairCount } = data;
  const sub =
    flaggedDevices.length === 0
      ? "Everything is on track"
      : `${flaggedDevices.length} devices flagged · ${inRepairCount} in repair`;

  return (
    <Card className="shadow-none gap-0 py-0 overflow-hidden">
      <div className="px-5 pt-[18px] pb-[14px]">
        <div className="text-[15px] font-semibold tracking-[-0.01em]">
          Needs attention
        </div>
        <div className="text-[12.5px] text-muted-foreground mt-0.5">{sub}</div>
      </div>
      {flaggedDevices.length === 0 ? (
        <div className="px-5 py-7 text-center text-[13px] text-muted-foreground border-t border-border">
          No devices need attention right now.
        </div>
      ) : (
        <div className="flex flex-col">
          {flaggedDevices.map((d) => (
            <Link
              key={d.id}
              href={`/devices/${d.code}`}
              className="flex items-center gap-3 px-5 py-3 border-t border-border hover:bg-muted transition-colors text-foreground hover:text-foreground"
            >
              <GroupIconTile icon={null} groupName={d.groupName} size="md" />
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-medium truncate">{d.name}</div>
                <div className="text-[11.5px] text-muted-foreground font-mono">
                  {d.code}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {d.flags.map((f) => {
                  const Icon = FLAG_ICON[f];
                  return (
                    <span
                      key={f}
                      title={FLAG_META[f].label}
                      className="size-[26px] grid place-items-center rounded-full bg-[oklch(0.96_0.05_85)] text-[oklch(0.48_0.10_70)] dark:bg-[oklch(0.34_0.06_75)] dark:text-[oklch(0.84_0.12_85)]"
                    >
                      <Icon className="size-3.5" aria-hidden />
                    </span>
                  );
                })}
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
