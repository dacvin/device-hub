import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BrandMark } from "@/components/app/brand-mark";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-background text-foreground">
      <div className="mb-9">
        <BrandMark />
      </div>
      <div className="text-[72px] font-semibold leading-none tabular-nums tracking-[-0.03em] text-primary">
        404
      </div>
      <h1 className="mt-[18px] text-xl font-semibold">{t("title")}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground max-w-md text-center leading-[1.55]">
        {t("description")}
      </p>
      <div className="mt-6 flex gap-2.5">
        <Button asChild variant="outline">
          <Link href="/devices">{t("viewDevices")}</Link>
        </Button>
        <Button asChild>
          <Link href="/overview">{t("back")}</Link>
        </Button>
      </div>
    </div>
  );
}
