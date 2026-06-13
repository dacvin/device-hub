"use client";

import { useDepartmentsWithCounts } from "@/features/departments/hooks/use-departments-with-counts";
import { DepartmentsClient } from "./_components/departments-client";
import { DepartmentsPageSkeleton } from "./_components/page-skeleton";

export default function DepartmentsPage() {
  const { data: rows, isPending } = useDepartmentsWithCounts();
  if (isPending || !rows) return <DepartmentsPageSkeleton />;
  return <DepartmentsClient rows={rows} />;
}
