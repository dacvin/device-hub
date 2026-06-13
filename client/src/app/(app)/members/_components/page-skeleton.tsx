import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/app/page-shell";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export function MembersPageSkeleton() {
  const t = useTranslations("members");
  return (
    <PageShell title={t("title")} crumb={t("subtitle")}>
      <div className="space-y-5">
        {/* Role summary row — three cards: admins / managers / viewers */}
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-7 w-8" />
              </div>
            </Card>
          ))}
        </div>
        {/* Controls row: search + filters + invite/export */}
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-9 w-72" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-md" />
            ))}
          </div>
        </div>
        {/* Members table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-11 px-4 text-xs font-medium text-muted-foreground">{t("colMember")}</TableHead>
                <TableHead className="h-11 px-4 text-xs font-medium text-muted-foreground">{t("colRole")}</TableHead>
                <TableHead className="h-11 px-4 text-xs font-medium text-muted-foreground">{t("colDepartment")}</TableHead>
                <TableHead className="h-11 px-4 text-xs font-medium text-muted-foreground">{t("colDevicesManaged")}</TableHead>
                <TableHead className="h-11 px-4 text-xs font-medium text-muted-foreground">{t("colLastActive")}</TableHead>
                <TableHead className="h-11 px-4 text-xs font-medium text-muted-foreground">{t("colStatus")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i} className="h-14">
                  <TableCell className="px-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4"><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell className="px-4"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="px-4"><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell className="px-4"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="px-4"><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageShell>
  );
}
