'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { Boxes, Plus, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { ColumnDef, FilterFn } from '@tanstack/react-table';
import type { z } from 'zod';

import { BulkDeleteButton } from '@/components/app/data-table/bulk-delete-button';
import { DataTable } from '@/components/app/data-table/data-table';
import { PageLayout } from '@/components/app/page-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { CatalogInUseError } from '../utils/in-use-guard';
import { type CatalogFormApi, CatalogFormDialog } from './catalog-form-dialog';
import { CatalogRowActions } from './catalog-row-actions';
import { CatalogSkeleton } from './catalog-skeleton';
import { CatalogTabs } from './catalog-tabs';

import type { CatalogResource } from '../constants/catalog';

const nameSearch: FilterFn<{ name: string }> = (row, _id, value) =>
  row.original.name.toLowerCase().includes(String(value).toLowerCase());

export function CatalogClient<
  TItem extends { id: string; name: string },
  TValues extends Record<string, unknown>,
>({
  resource,
  useList,
  columns,
  formSchema,
  emptyFormValues,
  toFormValues,
  renderFields,
  newLabel,
  createTitle,
  editTitle,
  create,
  update,
  remove,
  onRowClick,
}: {
  resource: CatalogResource;
  useList: () => { data: TItem[] | undefined; isPending: boolean };
  columns: ColumnDef<TItem>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- schema input differs from TValues when transforms apply.
  formSchema: z.ZodType<TValues, any>;
  emptyFormValues: TValues;
  toFormValues: (item: TItem) => TValues;
  renderFields: (form: CatalogFormApi) => ReactNode;
  newLabel: string;
  createTitle: string;
  editTitle: (item: TItem) => string;
  create: (values: TValues) => Promise<unknown>;
  update: (id: string, values: TValues) => Promise<unknown>;
  remove: (id: string) => Promise<void>;
  onRowClick?: (item: TItem) => void;
}) {
  const t = useTranslations('catalogs');
  const tRoot = useTranslations();
  const { data, isPending } = useList();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TItem | null>(null);

  const items = useMemo(() => data ?? [], [data]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const allColumns = useMemo<ColumnDef<TItem>[]>(
    () => [
      ...columns,
      {
        id: 'actions',
        header: () => null,
        enableSorting: false,
        meta: { className: 'w-0' },
        cell: ({ row }) => (
          <CatalogRowActions
            name={row.original.name}
            onEdit={() => {
              setEditing(row.original);
              setDialogOpen(true);
            }}
            onDelete={() => remove(row.original.id)}
          />
        ),
      },
    ],
    [columns, remove],
  );

  const emptyState = (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
        <Boxes className="size-6" />
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold">
          {items.length === 0 ? t('emptyTitle') : t('noMatchTitle')}
        </h3>
        <p className="text-muted-foreground text-sm">
          {items.length === 0 ? t('emptyDescription') : t('noMatchDescription')}
        </p>
      </div>
    </div>
  );

  return (
    <PageLayout
      title={t('title')}
      subtitle={t('description')}
      fill
      actions={
        <Button size="lg" onClick={openCreate}>
          <Plus />
          {newLabel}
        </Button>
      }
    >
      <div className="flex min-h-0 w-full max-w-4xl flex-1 flex-col">
        <div className="mb-4">
          <CatalogTabs active={resource} />
        </div>
        {isPending ? (
          <CatalogSkeleton columnCount={allColumns.length} />
        ) : (
          <DataTable
            columns={allColumns}
            data={items}
            globalFilterFn={nameSearch as unknown as FilterFn<TItem>}
            enableSelection
            countLabel={(n) => t('count', { count: n })}
            selectedLabel={(n) => tRoot('common.selected', { count: n })}
            clearLabel={tRoot('common.clear')}
            onRowClick={onRowClick}
            renderBulkActions={(rows, clear) => (
              <BulkDeleteButton
                count={rows.length}
                triggerLabel={t('bulkDelete')}
                title={t('bulkDeleteTitle', { count: rows.length })}
                body={t('bulkDeleteBody')}
                cancelLabel={t('cancel')}
                confirmLabel={t('bulkDelete')}
                onDone={clear}
                onDelete={async () => {
                  const results = await Promise.allSettled(rows.map((r) => remove(r.id)));
                  const ok = results.filter((r) => r.status === 'fulfilled').length;
                  const inUse = results.filter(
                    (r) => r.status === 'rejected' && r.reason instanceof CatalogInUseError,
                  ).length;
                  const failed = results.length - ok - inUse;
                  if (ok) toast.success(t('bulkDeletedToast', { count: ok }));
                  if (inUse) toast.error(t('bulkDeleteInUse', { count: inUse }));
                  if (failed) toast.error(t('bulkDeleteFailed'));
                }}
              />
            )}
            renderMobileCard={(item) => (
              <div className="bg-card flex size-full items-center gap-3 rounded-lg border px-4 py-3">
                <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
                <CatalogRowActions
                  name={item.name}
                  onEdit={() => {
                    setEditing(item);
                    setDialogOpen(true);
                  }}
                  onDelete={() => remove(item.id)}
                />
              </div>
            )}
            renderToolbar={(table) => (
              <div className="relative sm:max-w-xs">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                <Input
                  value={table.getState().globalFilter as string}
                  onChange={(e) => {
                    table.setGlobalFilter(e.target.value);
                  }}
                  placeholder={t('searchPlaceholder')}
                  aria-label={t('searchPlaceholder')}
                  className="bg-card pl-8"
                />
              </div>
            )}
            emptyState={emptyState}
          />
        )}
      </div>

      <CatalogFormDialog<TValues>
        key={editing?.id ?? 'new'}
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? editTitle(editing) : createTitle}
        schema={formSchema}
        defaultValues={editing ? toFormValues(editing) : emptyFormValues}
        submit={(values) => (editing ? update(editing.id, values) : create(values))}
        renderFields={renderFields}
      />
    </PageLayout>
  );
}
