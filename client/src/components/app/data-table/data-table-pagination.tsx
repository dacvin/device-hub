'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Table } from '@tanstack/react-table';

import { IconButton } from '@/components/app/icon-button';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Windowed page numbers with ellipses, e.g. [1, '…', 4, 5, 6, '…', 20].
function pageWindow(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'ellipsis')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push('ellipsis');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push('ellipsis');
  pages.push(total);
  return pages;
}

const PAGE_SIZES = [10, 20, 50, 100];

export function DataTablePagination<TData>({ table }: { table: Table<TData> }) {
  const t = useTranslations('common');
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();
  const current = pageIndex + 1;
  const total = Math.max(pageCount, 1);

  return (
    <div className="flex items-center justify-between gap-2 sm:grid sm:grid-cols-3">
      <p className="text-muted-foreground order-2 hidden font-mono text-xs tracking-[-0.01em] tabular-nums sm:order-1 sm:block sm:text-left">
        {t('pageOf', { current, total })}
      </p>

      <div className="order-1 flex items-center justify-center gap-1 sm:order-2">
        <IconButton
          label={t('previousPage')}
          variant="outline"
          size="icon-sm"
          className="size-9 sm:size-7"
          onClick={() => {
            table.previousPage();
          }}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft />
        </IconButton>

        {/* Numbered window on sm+ */}
        <div className="hidden items-center gap-1 sm:flex">
          {pageWindow(current, total).map((p, i) =>
            p === 'ellipsis' ? (
              <span key={`e${i}`} className="text-muted-foreground px-1 text-sm">
                …
              </span>
            ) : (
              <Button
                key={p}
                variant={p === current ? 'default' : 'ghost'}
                size="icon-sm"
                aria-label={t('page', { page: p })}
                aria-current={p === current ? 'page' : undefined}
                onClick={() => {
                  table.setPageIndex(p - 1);
                }}
                className={cn(
                  'font-mono tracking-[-0.01em] tabular-nums',
                  p !== current && 'text-muted-foreground',
                )}
              >
                {p}
              </Button>
            ),
          )}
        </div>

        {/* Compact indicator on mobile */}
        <span className="min-w-28 px-2 text-center font-mono text-sm tracking-[-0.01em] tabular-nums sm:hidden">
          {t('pageOf', { current, total })}
        </span>

        <IconButton
          label={t('nextPage')}
          variant="outline"
          size="icon-sm"
          className="size-9 sm:size-7"
          onClick={() => {
            table.nextPage();
          }}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight />
        </IconButton>
      </div>

      <div className="order-3 flex items-center justify-center gap-2 sm:justify-end">
        <Select
          value={String(table.getState().pagination.pageSize)}
          onValueChange={(v) => {
            table.setPageSize(Number(v));
          }}
        >
          <SelectTrigger size="sm" className="bg-card min-h-9 w-[4.5rem] sm:min-h-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((s) => (
              <SelectItem key={s} value={String(s)}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground hidden text-xs sm:inline">{t('perPage')}</span>
      </div>
    </div>
  );
}
