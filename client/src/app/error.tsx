"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { BrandMark } from "@/components/app/brand-mark";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("serverError");
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-background text-foreground">
      <div className="mb-9">
        <BrandMark />
      </div>
      <div className="text-[72px] font-semibold leading-none tabular-nums tracking-[-0.03em] text-destructive">
        500
      </div>
      <h1 className="mt-[18px] text-xl font-semibold">{t("title")}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground max-w-md text-center leading-[1.55]">
        {t("description")}
      </p>
      {error.digest ? (
        <p className="mt-6 text-[11.5px] text-muted-foreground font-mono bg-muted px-2.5 py-1.5 rounded-md">
          {error.digest}
        </p>
      ) : null}
      <div className="mt-6 flex gap-2.5">
        <Button variant="outline" onClick={reset}>
          {t("reload")}
        </Button>
        <Button asChild>
          <Link href="/overview">{t("back")}</Link>
        </Button>
      </div>
    </div>
  );
}
