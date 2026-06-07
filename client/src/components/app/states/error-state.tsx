"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ErrorStateProps {
  title: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  requestId?: string;
}

export function ErrorState({ title, description, retryLabel = "Try again", onRetry, requestId }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="size-[60px] rounded-2xl bg-[color-mix(in_oklch,var(--destructive)_14%,var(--card))] text-destructive flex items-center justify-center mb-3.5">
        <AlertCircle className="size-7" aria-hidden />
      </div>
      <h2 className="text-[17px] font-semibold tracking-[-0.01em] mb-1.5">{title}</h2>
      {description ? <p className="text-[13.5px] leading-[1.55] text-muted-foreground max-w-[420px]">{description}</p> : null}
      {onRetry ? (
        <Button onClick={onRetry} className="mt-5">{retryLabel}</Button>
      ) : null}
      {requestId ? (
        <p className="mt-4 text-xs text-muted-foreground font-mono">{requestId}</p>
      ) : null}
    </div>
  );
}
