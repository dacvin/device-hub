'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnHeader } from '@/components/app/data-table/data-table-column-header';

import { useCreateManufacturer } from '../../api/create-manufacturer';
import { useDeviceCounts } from '../../api/get-device-counts';
import { usePaginatedManufacturers } from '../../api/get-paginated-manufacturers';
import { useSoftDeleteManufacturer } from '../../api/soft-delete-manufacturer';
import { useUpdateManufacturer } from '../../api/update-manufacturer';
import {
  createManufacturerFormSchema,
  type CreateManufacturerFormValues,
} from '../../validations/manufacturer';
import { CatalogClient } from '../catalog-client';
import { CatalogTextField } from '../catalog-fields';

import type { ManufacturerListItem } from '../../types/manufacturer';

function useManufacturersList() {
  const { data, isPending } = usePaginatedManufacturers({ params: { limit: 100 } });
  return { data: data?.items, isPending };
}

export function ManufacturersCatalog() {
  const t = useTranslations('catalogs');
  const locale = useLocale();
  const dateFmt = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const { data: counts } = useDeviceCounts();

  const createM = useCreateManufacturer();
  const updateM = useUpdateManufacturer();
  const deleteM = useSoftDeleteManufacturer();

  const columns: ColumnDef<ManufacturerListItem>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('colName')} />,
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'supportContact',
      header: t('colSupportContact'),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.supportContact ?? '—'}</span>
      ),
      enableSorting: false,
    },
    {
      id: 'deviceCount',
      accessorFn: (row) => counts?.byManufacturer[row.id] ?? 0,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('colDevices')} />,
      cell: ({ row }) => (
        <span className="font-mono tracking-[-0.01em] tabular-nums">
          {counts?.byManufacturer[row.original.id] ?? 0}
        </span>
      ),
      meta: { className: 'text-right' },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('colCreated')} />,
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-sm tracking-[-0.01em] tabular-nums">
          {dateFmt.format(new Date(row.original.createdAt))}
        </span>
      ),
      meta: { className: 'hidden text-right sm:table-cell' },
    },
  ];

  return (
    <CatalogClient<ManufacturerListItem, CreateManufacturerFormValues>
      resource="manufacturers"
      useList={useManufacturersList}
      columns={columns}
      formSchema={createManufacturerFormSchema}
      emptyFormValues={{ name: '', supportContact: '' }}
      toFormValues={(m) => ({ name: m.name, supportContact: m.supportContact ?? '' })}
      newLabel={t('createManufacturer')}
      createTitle={t('createTitleManufacturer')}
      editTitle={() => t('editTitleManufacturer')}
      create={(values) => createM.mutateAsync(values)}
      update={(id, values) => updateM.mutateAsync({ id, data: values })}
      remove={(id) => deleteM.mutateAsync(id)}
      renderFields={(form) => (
        <>
          <form.Field name="name">
            {(field) => <CatalogTextField field={field} label={t('fieldName')} required />}
          </form.Field>
          <form.Field name="supportContact">
            {(field) => <CatalogTextField field={field} label={t('fieldSupportContact')} />}
          </form.Field>
        </>
      )}
    />
  );
}
