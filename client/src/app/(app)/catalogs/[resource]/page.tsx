import { notFound } from 'next/navigation';

import { GroupsCatalog } from '@/features/catalogs/components/resources/groups-catalog';
import { ManufacturersCatalog } from '@/features/catalogs/components/resources/manufacturers-catalog';
import { isCatalogResource } from '@/features/catalogs/constants/catalog';

export default async function CatalogResourcePage({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  const { resource } = await params;
  if (!isCatalogResource(resource)) notFound();

  return (
    <>
      {resource === 'groups' && <GroupsCatalog />}
      {resource === 'manufacturers' && <ManufacturersCatalog />}
    </>
  );
}
