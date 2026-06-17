import { type ReactNode } from "react";

export interface PageTopbarProps {
  title: ReactNode;
  crumb?: ReactNode;
  actions?: ReactNode;
}

export function PageTopbar({ title, crumb, actions }: PageTopbarProps) {
  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/[0.86] backdrop-blur">
      <div className="flex flex-wrap items-center gap-4 px-7 min-h-[58px] py-3 max-[640px]:flex-col max-[640px]:items-stretch max-[640px]:gap-2.5">
        <div className="min-w-0 flex flex-col gap-0.5">
          <div className="text-[22px] leading-7 font-semibold tracking-[-0.01em] truncate">
            {title}
          </div>
          {crumb ? (
            <div className="text-[13px] text-muted-foreground truncate">{crumb}</div>
          ) : null}
        </div>
        {actions ? (
          <div className="ml-auto flex flex-wrap items-center gap-2.5 max-[640px]:ml-0 max-[640px]:w-full">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
