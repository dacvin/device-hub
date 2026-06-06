import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function CountLink({
  count,
  href,
  max,
  className,
}: {
  count: number;
  href: string;
  /** When provided, renders an inline mini bar (count / max) inside the link. */
  max?: number;
  className?: string;
}) {
  const pct =
    max === undefined || max === 0 ? 0 : Math.min(100, (count / max) * 100);
  return (
    <Link
      href={href}
      className={cn(
        "group/count inline-flex items-center gap-2.5 rounded-md -mx-2 -my-1 px-2 py-1",
        "hover:bg-accent hover:text-accent-foreground transition-colors",
        className
      )}
    >
      {max !== undefined && (
        <span className="block h-1.5 w-[120px] flex-1 max-w-[120px] overflow-hidden rounded-full bg-muted">
          <span
            className="block h-full rounded-full bg-primary"
            style={{ width: `${pct}%` }}
          />
        </span>
      )}
      <span className="min-w-[18px] text-[13px] font-semibold tabular-nums">
        {count}
      </span>
      <ArrowRight className="size-[15px] -translate-x-[3px] text-muted-foreground opacity-0 transition-all group-hover/count:translate-x-0 group-hover/count:opacity-100" />
    </Link>
  );
}

export function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.min(100, (value / max) * 100);
  return (
    <span className="ml-2 inline-block h-1.5 w-[120px] overflow-hidden rounded-full bg-muted align-middle">
      <span className="block h-full bg-primary" style={{ width: `${pct}%` }} />
    </span>
  );
}
