import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline";
}

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actions?: EmptyStateAction[];
}

export function EmptyState({ icon: Icon, title, description, actions }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="size-14 rounded-full bg-muted text-muted-foreground flex items-center justify-center mb-4">
        <Icon className="size-7" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold mb-1">{title}</h2>
      {description ? <p className="text-sm text-muted-foreground max-w-md">{description}</p> : null}
      {actions?.length ? (
        <div className="mt-5 flex gap-2">
          {actions.map((a, i) =>
            a.href ? (
              <Button key={i} asChild variant={a.variant ?? "default"}>
                <Link href={a.href}>{a.label}</Link>
              </Button>
            ) : (
              <Button key={i} variant={a.variant ?? "default"} onClick={a.onClick}>{a.label}</Button>
            )
          )}
        </div>
      ) : null}
    </div>
  );
}
