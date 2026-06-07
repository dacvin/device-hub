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
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span
          className={cn(
            "size-[34px] rounded-[9px] flex items-center justify-center flex-none",
            tone === "alert"
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
              : "bg-secondary text-secondary-foreground"
          )}
        >
          <Icon className="size-[17px]" aria-hidden />
        </span>
      </div>
      <div className="text-[30px] font-semibold leading-none tabular-nums tracking-tight">{value}</div>
      {subtitle ? <div className="mt-2 text-[12.5px] text-muted-foreground">{subtitle}</div> : null}
    </Card>
  );
}
