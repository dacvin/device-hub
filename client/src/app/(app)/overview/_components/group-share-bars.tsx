import Link from "next/link";
import { Card } from "@/components/ui/card";
import { HardDrive } from "lucide-react";

export interface GroupShareRow {
  groupId: string;
  groupName: string;
  groupIcon: string | null;
  count: number;
}

export function GroupShareBars({
  rows,
  total,
  title,
  subtitle,
  manageLabel,
  manageHref,
}: {
  rows: GroupShareRow[];
  total: number;
  title: string;
  subtitle: string;
  manageLabel: string;
  manageHref: string;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between px-5 pt-[18px] pb-0">
        <div>
          <div className="text-[15px] font-semibold tracking-tight">{title}</div>
          <div className="text-[12.5px] text-muted-foreground mt-0.5">{subtitle}</div>
        </div>
        <Link
          href={manageHref}
          className="text-[13px] text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          {manageLabel}
        </Link>
      </div>
      <div className="px-5 pt-[18px] pb-5">
        <div className="flex flex-col gap-[13px]">
          {rows.map((r) => {
            const pct = total ? (r.count / total) * 100 : 0;
            const pctRounded = Math.round(pct);
            return (
              <Link
                key={r.groupId}
                href={`/devices?group=${r.groupId}`}
                className="grid items-center gap-3"
                style={{ gridTemplateColumns: "116px 1fr auto", color: "inherit" }}
              >
                <span className="flex items-center gap-[9px] text-[13px] font-medium min-w-0">
                  <span className="size-[26px] rounded-[7px] bg-secondary text-secondary-foreground flex items-center justify-center flex-none">
                    <HardDrive className="size-[14px]" aria-hidden />
                  </span>
                  <span className="truncate">{r.groupName}</span>
                </span>
                <span className="block h-2 rounded-full bg-muted overflow-hidden">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{ width: `${pct}%` }}
                    aria-hidden
                  />
                </span>
                <span className="flex items-baseline gap-[6px] justify-end min-w-[64px]">
                  <span className="text-[13px] font-semibold tabular-nums">{r.count}</span>
                  <span className="text-[11.5px] text-muted-foreground tabular-nums">{pctRounded}%</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
