import Link from "next/link";
import { HardDrive, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import type { DeviceWithFlags } from "@/lib/domain/devices";
import { StatusBadge } from "@/components/app/status-badge";

interface DevicesManagedProps {
  devices: DeviceWithFlags[];
  departmentId: string | null;
  departmentName: string | null;
  isViewer?: boolean;
}

export async function DevicesManaged({
  devices,
  departmentId,
  departmentName,
  isViewer = false,
}: DevicesManagedProps) {
  const t = await getTranslations("memberProfile");
  const deptLabel = departmentName ?? "—";

  return (
    <Card className="p-[22px]">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[13px] font-semibold tracking-[0.04em] uppercase text-muted-foreground flex items-center gap-2">
          <HardDrive className="size-[15px] text-primary" />
          {t("devicesManagedTitle")}
        </div>
        {!isViewer && devices.length > 0 && departmentId && (
          <Link
            href={`/devices?dept=${departmentId}`}
            className="inline-flex items-center gap-1 text-[13px] text-primary font-medium"
          >
            {t("viewAllInDept", { department: deptLabel })}
            <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>

      {isViewer ? (
        <div className="pt-[22px] pb-1.5 text-center text-muted-foreground text-[13.5px]">
          {t("viewerReadOnly")}
        </div>
      ) : devices.length === 0 ? (
        <div className="pt-[22px] pb-1.5 text-center text-muted-foreground text-[13.5px]">
          {t("devicesManagedEmpty")}
        </div>
      ) : (
        <div className="mt-1.5">
          {devices.map((device, i) => (
            <Link
              key={device.id}
              href={`/devices/${device.code}`}
              className={
                "flex items-center gap-3 px-1 py-[11px] -mx-1 rounded-[var(--radius-md)] hover:bg-muted transition-colors" +
                (i < devices.length - 1 ? " border-b border-border" : "")
              }
            >
              <span className="size-[34px] rounded-[9px] bg-secondary text-secondary-foreground inline-flex items-center justify-center flex-none">
                <HardDrive className="size-[17px]" />
              </span>
              <span className="flex-1 min-w-0">
                <div className="text-[14px] font-medium truncate">{device.name}</div>
                <div className="font-mono text-[12px] text-muted-foreground">{device.code}</div>
              </span>
              <StatusBadge status={device.status} />
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
