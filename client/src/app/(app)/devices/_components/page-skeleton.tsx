"use client";

import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/app/page-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function DevicesPageSkeleton() {
  const t = useTranslations("devices.list");
  const tCols = useTranslations("devices.columns");
  return (
    <PageShell title={t("title")} crumb={t("subtitle")}>
      <div className="space-y-4">
        {/* Search + filter chips row */}
        <div className="flex flex-col gap-3">
          <Skeleton className="h-9 w-72" />
          <div className="flex flex-wrap gap-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-36 rounded-md" />
            ))}
          </div>
        </div>
        {/* Device table — mirrors buildColumns order:
            select, type, code, name, group, department, manufacturer,
            condition, location, status, flags, quantity, actions */}
        <div className="rounded-[var(--radius-xl)] border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-11 w-10 px-4">
                  <Skeleton className="h-4 w-4 rounded" />
                </TableHead>
                <TableHead className="h-11 px-4 text-xs font-medium text-muted-foreground" />
                <TableHead className="h-11 px-4 text-xs font-medium text-muted-foreground">{tCols("code")}</TableHead>
                <TableHead className="h-11 px-4 text-xs font-medium text-muted-foreground">{tCols("name")}</TableHead>
                <TableHead className="h-11 px-4 text-xs font-medium text-muted-foreground">{tCols("group")}</TableHead>
                <TableHead className="h-11 px-4 text-xs font-medium text-muted-foreground">{tCols("department")}</TableHead>
                <TableHead className="h-11 px-4 text-xs font-medium text-muted-foreground">{t("columnManufacturer")}</TableHead>
                <TableHead className="h-11 px-4 text-xs font-medium text-muted-foreground">{tCols("condition")}</TableHead>
                <TableHead className="h-11 px-4 text-xs font-medium text-muted-foreground">{tCols("location")}</TableHead>
                <TableHead className="h-11 px-4 text-xs font-medium text-muted-foreground">{tCols("status")}</TableHead>
                <TableHead className="h-11 px-4 text-xs font-medium text-muted-foreground">{tCols("flags")}</TableHead>
                <TableHead className="h-11 px-4 text-xs font-medium text-muted-foreground">{tCols("quantity")}</TableHead>
                <TableHead className="h-11 w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i} className="h-14">
                  <TableCell className="px-4"><Skeleton className="h-4 w-4 rounded" /></TableCell>
                  <TableCell className="px-4"><Skeleton className="h-7 w-7 rounded-md" /></TableCell>
                  <TableCell className="px-4"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="px-4"><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell className="px-4"><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell className="px-4"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="px-4"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="px-4"><Skeleton className="h-4 w-10" /></TableCell>
                  <TableCell className="px-4"><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell className="px-4"><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell className="px-4"><Skeleton className="h-5 w-12 rounded-full" /></TableCell>
                  <TableCell className="px-4"><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell className="px-4" />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageShell>
  );
}
