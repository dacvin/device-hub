import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { DeviceWithFlags } from "@/lib/domain/devices";

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
        <div className="flex flex-col mt-2">
          {devices.map((d) => (
            <Link
              key={d.id}
              href={`/devices/${d.code}`}
              className="flex items-center gap-3 px-5 py-3 border-t border-border hover:bg-muted transition-colors"
            >
              <span className="size-[34px] rounded-[9px] bg-secondary text-secondary-foreground flex items-center justify-center flex-none">
                <svg
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
                </svg>
              </span>
              <span className="flex-1 min-w-0">
                <div className="text-[13.5px] font-medium truncate">{d.name}</div>
                <div className="text-[11.5px] text-muted-foreground font-mono">{d.code}</div>
              </span>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
