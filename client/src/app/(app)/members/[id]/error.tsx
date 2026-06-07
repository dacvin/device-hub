"use client";

import { ErrorState } from "@/components/app/states/error-state";
import { useTranslations } from "next-intl";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("states");
  return (
    <ErrorState
      title={t("errorTitle")}
      description={t("errorDescription")}
      onRetry={reset}
      requestId={error.message.slice(0, 64)}
    />
  );
}
