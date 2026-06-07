import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PermissionDeniedProps {
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
  requestAccessHref?: string;
  requestAccessLabel?: string;
}

export function PermissionDenied({
  title, description,
  backHref = "/overview", backLabel = "Back to overview",
  requestAccessHref, requestAccessLabel = "Request access",
}: PermissionDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="size-[60px] rounded-2xl bg-[oklch(0.96_0.05_85)] dark:bg-[oklch(0.34_0.06_75)] text-[oklch(0.48_0.10_70)] dark:text-[oklch(0.84_0.12_85)] flex items-center justify-center mb-3.5">
        <Lock className="size-7" aria-hidden />
      </div>
      <h2 className="text-[17px] font-semibold tracking-[-0.01em] mb-1.5">{title}</h2>
      <p className="text-[13.5px] leading-[1.55] text-muted-foreground max-w-[420px] mb-[18px]">{description}</p>
      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
        {requestAccessHref ? (
          <Button asChild>
            <a href={requestAccessHref}>{requestAccessLabel}</a>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
