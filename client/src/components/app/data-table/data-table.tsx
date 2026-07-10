'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  RowSelectionState,
  SortingState,
  Table as TanstackTable,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

import { DataTablePagination } from './data-table-pagination';

export function DataTable<TData>({
  columns,
  data,
  renderToolbar,
  onRowClick,
  globalFilterFn,
  initialPageSize = 20,
  emptyState,
  enableSelection = false,
  countLabel,
  selectedLabel,
  clearLabel = 'Clear',
  renderBulkActions,
  renderMobileCard,
  initialColumnFilters,
  className,
}: {
  columns: ColumnDef<TData>[];
  data: TData[];
  renderToolbar?: (table: TanstackTable<TData>) => ReactNode;
  onRowClick?: (row: TData) => void;
  globalFilterFn?: FilterFn<TData>;
  initialPageSize?: number;
  emptyState?: ReactNode;
  enableSelection?: boolean;
  /** Localized label for the total (filtered) row count, shown top-left. */
  countLabel?: (total: number) => string;
  /** Localized label for the number of selected rows. */
  selectedLabel?: (count: number) => string;
  clearLabel?: string;
  /** Bulk actions shown in the selection bar; receives selected rows + a clear fn. */
  renderBulkActions?: (rows: TData[], clearSelection: () => void) => ReactNode;
  /** Per-row card for small screens. When set, the table is hidden below `md` and
   * these cards (over the same filtered/sorted/paginated rows) render instead. */
  renderMobileCard?: (row: TData) => ReactNode;
  initialColumnFilters?: ColumnFiltersState;
  className?: string;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    initialColumnFilters ?? [],
  );
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const selectColumn: ColumnDef<TData> = {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => {
          table.toggleAllPageRowsSelected(!!value);
        }}
        className="border-muted-foreground/40"
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => {
          row.toggleSelected(!!value);
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="border-muted-foreground/40"
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    meta: { className: 'w-0 pr-0' },
  };

  // TanStack Table returns fresh function instances each render, which the React
  // Compiler can't memoize; the hook manages its own stability internally.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: enableSelection ? [selectColumn, ...columns] : columns,
    state: { sorting, columnFilters, globalFilter, rowSelection },
    enableRowSelection: enableSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: { pagination: { pageSize: initialPageSize } },
  });

  const rows = table.getRowModel().rows;
  const colCount = enableSelection ? columns.length + 1 : columns.length;
  const total = table.getFilteredRowModel().rows.length;
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col gap-3', className)}>
      {renderToolbar?.(table)}

      {/* Count / selection bar — total lives at the top of the table. */}
      <div className="text-muted-foreground flex h-6 items-center justify-between text-xs">
        {selectedCount > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-foreground font-mono font-medium tracking-[-0.01em] tabular-nums">
              {selectedLabel ? selectedLabel(selectedCount) : `${selectedCount} selected`}
            </span>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                table.resetRowSelection();
              }}
            >
              {clearLabel}
            </Button>
            {renderBulkActions?.(
              table.getFilteredSelectedRowModel().rows.map((r) => r.original),
              () => {
                table.resetRowSelection();
              },
            )}
          </div>
        ) : (
          <span className="font-mono tracking-[-0.01em] tabular-nums">
            {countLabel ? countLabel(total) : `${total} ${total === 1 ? 'row' : 'rows'}`}
          </span>
        )}
      </div>

      <div
        className={cn(
          'min-h-0 flex-1 overflow-hidden',
          renderMobileCard
            ? 'md:bg-card md:rounded-lg md:border md:shadow-xs'
            : 'bg-card rounded-lg border shadow-xs',
        )}
      >
        <div className={cn('h-full overflow-auto', renderMobileCard && 'hidden md:block')}>
          <Table>
            <TableHeader className="bg-secondary sticky top-0 z-10">
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="border-border hover:bg-transparent">
                  {hg.headers.map((header) => (
                    <TableHead key={header.id} className={header.column.columnDef.meta?.className}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rows.length ? (
                rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? 'selected' : undefined}
                    onClick={
                      onRowClick
                        ? () => {
                            onRowClick(row.original);
                          }
                        : undefined
                    }
                    className={cn(
                      'hover:bg-secondary/60',
                      row.index % 2 === 1 && 'bg-muted/60',
                      onRowClick && 'cursor-pointer',
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={colCount} className="p-0">
                    {emptyState ?? (
                      <div className="text-muted-foreground flex h-64 items-center justify-center text-sm">
                        No results.
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {renderMobileCard && (
          <div className="h-full overflow-auto md:hidden">
            {rows.length ? (
              <div className="grid grid-cols-1 gap-3 pb-2 sm:grid-cols-2">
                {rows.map((row) => (
                  <div key={row.id} className="flex">
                    {renderMobileCard(row.original)}
                  </div>
                ))}
              </div>
            ) : (
              (emptyState ?? (
                <div className="text-muted-foreground flex h-64 items-center justify-center text-sm">
                  No results.
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
