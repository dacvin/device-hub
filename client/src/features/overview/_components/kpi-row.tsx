import {
  CircleCheckBig,
  HardDrive,
  TriangleAlert,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { OverviewSummary } from "@/features/overview/api/get-overview-summary";

interface KpiSpec {
  label: string;
  value: number;
  sub: React.ReactNode;
  icon: LucideIcon;
  alert?: boolean;
}

function Num({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-semibold text-foreground tabular-nums">{children}</span>
  );
}

export function KpiRow({ data }: { data: OverviewSummary }) {
  const kpis: KpiSpec[] = [
    {
      label: "Total devices",
      value: data.totalDevices,
      sub: (
        <>
          <Num>{data.totalQuantity}</Num> units across <Num>{data.totalGroups}</Num> groups
        </>
      ),
      icon: HardDrive,
    },
    {
      label: "In use",
      value: data.byStatus["in-use"],
      sub: (
        <>
          <Num>{data.byStatus.storage}</Num> in storage · <Num>{data.byStatus.retired}</Num> retired
        </>
      ),
      icon: CircleCheckBig,
    },
    {
      label: "Needs attention",
      value: data.flaggedCount,
      sub: "Warranty & inventory flags",
      icon: TriangleAlert,
      alert: data.flaggedCount > 0,
    },
    {
      label: "In repair",
      value: data.inRepairCount,
      sub: (
        <>
          Avg. condition <Num>{data.avgCondition}%</Num> fleet-wide
        </>
      ),
      icon: Wrench,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 max-[1080px]:grid-cols-2 max-[640px]:grid-cols-1">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="p-5 flex flex-col gap-3 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground font-medium">
              {kpi.label}
            </span>
            <span
              className={cn(
                "size-[34px] rounded-[9px] grid place-items-center shrink-0",
                kpi.alert
                  ? "bg-[oklch(0.96_0.05_85)] text-[oklch(0.48_0.10_70)] dark:bg-[oklch(0.34_0.06_75)] dark:text-[oklch(0.84_0.12_85)]"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              <kpi.icon className="size-[17px]" aria-hidden />
            </span>
          </div>
          <div className="text-[30px] font-semibold tracking-[-0.02em] leading-none tabular-nums">
            {kpi.value}
          </div>
          <div className="text-[12.5px] text-muted-foreground">{kpi.sub}</div>
        </Card>
      ))}
    </div>
  );
}
