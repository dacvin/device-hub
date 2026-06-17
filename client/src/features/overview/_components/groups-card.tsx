import Link from "next/link";
import { Card } from "@/components/ui/card";
import { GroupIconTile } from "./group-icon-tile";
import type { OverviewSummary } from "@/features/overview/api/get-overview-summary";

export function GroupsCard({ data }: { data: OverviewSummary }) {
  const total = data.totalDevices;

  return (
    <Card className="shadow-none gap-0">
      <div className="flex items-start justify-between px-5 pt-[18px]">
        <div>
          <div className="text-[15px] font-semibold tracking-[-0.01em]">
            Inventory by group
          </div>
          <div className="text-[12.5px] text-muted-foreground mt-0.5">
            Share of all{" "}
            <span className="font-semibold text-foreground tabular-nums">{total}</span>{" "}
            devices
          </div>
        </div>
        <Link
          href="/catalog/groups"
          className="text-[13px] font-medium text-muted-foreground hover:text-foreground"
        >
          Manage groups
        </Link>
      </div>
      <div className="px-5 pt-[18px] pb-5">
        {data.byGroup.length === 0 ? (
          <div className="text-[13px] text-muted-foreground py-2">
            No devices yet.
          </div>
        ) : (
          <div className="flex flex-col gap-[13px]">
            {data.byGroup.map((g) => {
              const pct = total > 0 ? Math.round((g.count / total) * 100) : 0;
              return (
                <Link
                  key={g.name}
                  href={`/devices?group=${encodeURIComponent(g.name)}`}
                  className="grid items-center gap-3 text-foreground hover:text-foreground"
                  style={{ gridTemplateColumns: "116px 1fr auto" }}
                >
                  <span className="flex items-center gap-2.5 text-[13px] font-medium min-w-0">
                    <GroupIconTile icon={g.icon} groupName={g.name} />
                    <span className="truncate">{g.name}</span>
                  </span>
                  <span className="block h-2 rounded-full bg-muted overflow-hidden">
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: `${(g.count / total) * 100}%` }}
                    />
                  </span>
                  <span className="flex items-baseline gap-1.5 justify-end min-w-[64px]">
                    <span className="text-[13px] font-semibold tabular-nums">
                      {g.count}
                    </span>
                    <span className="text-[11.5px] text-muted-foreground tabular-nums">
                      {pct}%
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
