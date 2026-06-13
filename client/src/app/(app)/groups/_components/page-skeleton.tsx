import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { CatalogPageShell } from "@/app/(app)/_components/catalog-page-shell";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export function GroupsPageSkeleton() {
  const t = useTranslations("groups");
  return (
    <CatalogPageShell
      title={t("title")}
      subtitle={t("subtitle")}
      metaLine=""
      addLabel={t("addAction")}
      onAdd={() => {}}
      search=""
      onSearchChange={() => {}}
    >
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-11 px-4 text-xs font-medium text-muted-foreground">{t("tableName")}</TableHead>
              <TableHead className="h-11 px-4 text-xs font-medium text-muted-foreground">{t("tableCycle")}</TableHead>
              <TableHead className="h-11 px-4 text-xs font-medium text-muted-foreground w-[200px]">{t("tableDevices")}</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i} className="h-14">
                <TableCell className="px-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </TableCell>
                <TableCell className="px-4"><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell className="px-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-6" />
                    <Skeleton className="h-1.5 w-32 rounded-full" />
                  </div>
                </TableCell>
                <TableCell className="px-4" />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CatalogPageShell>
  );
}
