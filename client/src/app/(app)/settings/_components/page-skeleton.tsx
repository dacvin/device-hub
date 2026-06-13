import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/app/page-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function SettingsPageSkeleton() {
  const t = useTranslations("settings");
  return (
    <PageShell title={t("title")}>
      <div className="space-y-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="px-[22px] py-5 border-b">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-72 mt-2" />
            </CardHeader>
            <CardContent className="p-[22px] space-y-5">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between gap-6">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-72" />
                  </div>
                  <Skeleton className="h-9 w-[200px] rounded-md" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
