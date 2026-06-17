import { type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({ title, icon: Icon, children, className }: SectionCardProps) {
  return (
    <Card className={cn("shadow-none gap-0 py-0", className)}>
      <div className="flex items-center gap-2 px-5 pt-5 pb-3">
        <Icon className="size-3.5 text-muted-foreground" aria-hidden />
        <h2 className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted-foreground">
          {title}
        </h2>
      </div>
      <div className="px-5 pb-5">{children}</div>
    </Card>
  );
}

interface DefinitionListProps {
  items: { label: string; value: React.ReactNode; mono?: boolean; fullWidth?: boolean }[];
  className?: string;
}

export function DefinitionList({ items, className }: DefinitionListProps) {
  return (
    <dl className={cn("grid grid-cols-2 gap-x-6 gap-y-5", className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className={cn("min-w-0", item.fullWidth && "col-span-2")}
        >
          <dt className="text-[12px] text-muted-foreground font-medium">{item.label}</dt>
          <dd
            className={cn(
              "text-[14px] text-foreground mt-1",
              item.mono && "font-mono text-[13px]",
            )}
          >
            {item.value ?? "—"}
          </dd>
        </div>
      ))}
    </dl>
  );
}
