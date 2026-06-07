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
      <div className="size-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
        <AlertCircle className="size-7" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold mb-1">{title}</h2>
      {description ? <p className="text-sm text-muted-foreground max-w-md">{description}</p> : null}
      {onRetry ? (
        <Button onClick={onRetry} className="mt-5">{retryLabel}</Button>
      ) : null}
      {requestId ? (
        <p className="mt-4 text-xs text-muted-foreground font-mono">{requestId}</p>
      ) : null}
    </div>
  );
}
