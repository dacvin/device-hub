import { ReactNode } from "react";

export interface PageTopbarProps {
  title: ReactNode;
  crumb?: ReactNode;
  actions?: ReactNode;
}

export function PageTopbar({ title, crumb, actions }: PageTopbarProps) {
  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/[0.86] backdrop-blur">
      <div className="flex items-center gap-4 px-7 py-3.5">
        <div className="min-w-0 flex flex-col gap-0.5">
          <div className="text-[20px] font-semibold tracking-[-0.02em] truncate">{title}</div>
          {crumb ? (
            <div className="text-[13px] text-muted-foreground truncate">{crumb}</div>
          ) : null}
        </div>
        {actions ? (
          <div className="ml-auto flex items-center gap-2.5">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
