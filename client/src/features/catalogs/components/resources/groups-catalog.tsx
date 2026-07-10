'use client';

import { useRouter } from 'next/navigation';

import { Boxes } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnHeader } from '@/components/app/data-table/data-table-column-header';

import { useCreateGroup } from '../../api/create-group';
import { useDeviceCounts } from '../../api/get-device-counts';
import { usePaginatedGroups } from '../../api/get-paginated-groups';
import { useSoftDeleteGroup } from '../../api/soft-delete-group';
import { useUpdateGroup } from '../../api/update-group';
import { createGroupFormSchema, type CreateGroupFormValues } from '../../validations/group';
import { CatalogClient } from '../catalog-client';
import { CatalogIconField, CatalogTextField } from '../catalog-fields';
import { renderLucideIcon } from '../icon-picker';

import type { GroupListItem } from '../../types/group';

function useGroupsList() {
  const { data, isPending } = usePaginatedGroups({ params: { limit: 100 } });
  return { data: data?.items, isPending };
}

export function GroupsCatalog() {
  const t = useTranslations('catalogs');
  const locale = useLocale();
  const router = useRouter();
  const dateFmt = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const { data: counts } = useDeviceCounts();

  const createM = useCreateGroup();
  const updateM = useUpdateGroup();
  const deleteM = useSoftDeleteGroup();

  const columns: ColumnDef<GroupListItem>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('colName')} />,
      cell: ({ row }) => (
        <span className="flex items-center gap-2 font-medium">
          <span className="text-muted-foreground flex size-4 items-center justify-center">
            {renderLucideIcon(row.original.icon) ?? <Boxes className="size-4" />}
          </span>
          {row.original.name}
        </span>
      ),
    },
    {
      id: 'deviceCount',
      accessorFn: (row) => counts?.byGroup[row.id] ?? 0,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('colDevices')} />,
      cell: ({ row }) => (
        <span className="font-mono tracking-[-0.01em] tabular-nums">
          {counts?.byGroup[row.original.id] ?? 0}
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
    <CatalogClient<GroupListItem, CreateGroupFormValues>
      resource="groups"
      useList={useGroupsList}
      columns={columns}
      formSchema={createGroupFormSchema}
      emptyFormValues={{ name: '', icon: '' }}
      toFormValues={(g) => ({ name: g.name, icon: g.icon ?? '' })}
      newLabel={t('createGroup')}
      createTitle={t('createTitleGroup')}
      editTitle={() => t('editTitleGroup')}
      create={(values) => createM.mutateAsync(values)}
      update={(id, values) => updateM.mutateAsync({ id, data: values })}
      remove={(id) => deleteM.mutateAsync(id)}
      onRowClick={(g) => {
        router.push(`/devices?group=${encodeURIComponent(g.name)}`);
      }}
      renderFields={(form) => (
        <>
          <form.Field name="name">
            {(field) => <CatalogTextField field={field} label={t('fieldName')} required />}
          </form.Field>
          <form.Field name="icon">
            {(field) => <CatalogIconField field={field} label={t('fieldIcon')} />}
          </form.Field>
        </>
      )}
    />
  );
}
