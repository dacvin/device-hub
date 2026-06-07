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
      <div className="size-14 rounded-full bg-muted text-muted-foreground flex items-center justify-center mb-4">
        <Lock className="size-7" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground max-w-md mb-5">{description}</p>
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
