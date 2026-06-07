import { ReactNode } from "react";
import { PageTopbar, type PageTopbarProps } from "./page-topbar";

interface PageShellProps extends PageTopbarProps {
  children: ReactNode;
}

export function PageShell({ title, crumb, actions, children }: PageShellProps) {
  return (
    <>
      <PageTopbar title={title} crumb={crumb} actions={actions} />
      <div className="px-7 py-7">{children}</div>
    </>
  );
}
