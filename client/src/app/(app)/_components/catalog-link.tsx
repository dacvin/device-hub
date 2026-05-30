import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function CountLink({
  count,
  href,
  className,
}: {
  count: number;
  href: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm tabular-nums",
        "hover:bg-accent hover:text-accent-foreground transition-colors",
        className
      )}
    >
      <span className="font-medium">{count}</span>
      <span className="text-muted-foreground">{count === 1 ? "device" : "devices"}</span>
      <ArrowRight className="size-3 -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
    </Link>
  );
}

export function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.min(100, (value / max) * 100);
  return (
    <span className="inline-block h-1 w-12 rounded-full bg-muted overflow-hidden align-middle ml-2">
      <span className="block h-full bg-primary" style={{ width: `${pct}%` }} />
    </span>
  );
}
