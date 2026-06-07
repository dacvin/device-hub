import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  tone?: "default" | "alert";
}

export function KpiCard({ icon: Icon, label, value, subtitle, tone = "default" }: KpiCardProps) {
  return (
    <Card className="px-5 py-[18px] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
        <span
          className={cn(
            "size-[34px] rounded-[9px] flex items-center justify-center flex-none",
            tone === "alert"
              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
              : "bg-secondary text-secondary-foreground"
          )}
        >
          <Icon className="size-[17px]" aria-hidden />
        </span>
      </div>
      <div className="text-[30px] font-semibold leading-none tabular-nums tracking-[-0.02em]">{value}</div>
      {subtitle ? <div className="text-[12.5px] text-muted-foreground">{subtitle}</div> : null}
    </Card>
  );
}
