import Link from "next/link";
import { ShieldAlert, CalendarClock } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { DeviceFlag, DeviceWithFlags } from "@/lib/domain/devices";

const FLAG_ICON: Record<DeviceFlag, React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  "warranty-expiring": ShieldAlert,
  "inventory-overdue": CalendarClock,
};

function FlagIconChip({ flag }: { flag: DeviceFlag }) {
  const Icon = FLAG_ICON[flag];
  return (
    <span
      className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[oklch(0.96_0.05_85)] text-[oklch(0.48_0.10_70)] dark:bg-[oklch(0.34_0.06_75)] dark:text-[oklch(0.84_0.12_85)]"
      title={flag}
    >
      <Icon className="size-3" aria-hidden />
    </span>
  );
}

export function AttentionRail({
  devices,
  title,
  subtitle,
  emptyText,
}: {
  devices: DeviceWithFlags[];
  title: string;
  subtitle: string;
  emptyText: string;
}) {
  return (
    <Card>
      <div className="px-5 pt-[18px] pb-0">
        <div className="text-[15px] font-semibold tracking-tight">{title}</div>
        <div className="text-[12.5px] text-muted-foreground mt-0.5">{subtitle}</div>
      </div>
      {devices.length === 0 ? (
        <div className="px-5 py-7 text-center text-[13px] text-muted-foreground">{emptyText}</div>
      ) : (
        <div className="flex flex-col">
          {devices.map((d) => (
            <Link
              key={d.id}
              href={`/devices/${d.code}`}
              className="flex items-center gap-3 px-5 py-3 border-t border-border hover:bg-muted transition-[background] duration-[120ms]"
            >
              <span className="size-[34px] rounded-[9px] bg-secondary text-secondary-foreground flex items-center justify-center flex-none">
                <HardDriveIcon />
              </span>
              <span className="flex-1 min-w-0">
                <div className="text-[13.5px] font-medium truncate">{d.name}</div>
                <div className="text-[11.5px] text-muted-foreground font-mono">{d.code}</div>
              </span>
              <span className="flex gap-1 flex-none">
                {d.flags.map((f) => (
                  <FlagIconChip key={f} flag={f} />
                ))}
              </span>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

function HardDriveIcon() {
  return (
    <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
    </svg>
  );
}
