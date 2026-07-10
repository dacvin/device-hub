import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';

import { ArrowLeft } from 'lucide-react';

import { cn } from '@/lib/utils';

export function PageLayout({
  title,
  subtitle,
  actions,
  backHref,
  backLabel,
  contentWidth,
  fill,
  children,
}: {
  title: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  contentWidth?: number;
  /** When true, the content region fills the viewport height and the child manages its own scroll (used by data tables). */
  fill?: boolean;
  children: ReactNode;
}) {
  const contentStyle: CSSProperties | undefined = contentWidth
    ? { maxWidth: contentWidth }
    : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b px-4 pt-6 pb-4 md:px-6 md:pt-8">
        {backHref && (
          <Link
            href={backHref}
            className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-sm transition-colors"
          >
            <ArrowLeft className="size-4" />
            {backLabel}
          </Link>
        )}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      </header>

      {fill ? (
        <div className="flex min-h-0 flex-1 flex-col px-4 py-6 md:px-6">{children}</div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
          <div className={cn(contentWidth && 'mx-auto w-full')} style={contentStyle}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
