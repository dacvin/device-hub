"use client";

import { useManufacturersWithCounts } from "@/features/manufacturers/hooks/use-manufacturers-with-counts";
import { ManufacturersClient } from "./_components/manufacturers-client";
import { ManufacturersPageSkeleton } from "./_components/page-skeleton";

export default function ManufacturersPage() {
  const { data: rows, isPending } = useManufacturersWithCounts();
  if (isPending || !rows) return <ManufacturersPageSkeleton />;
  return <ManufacturersClient rows={rows} />;
}
