import { cn } from "@/lib/utils";

export function Sk({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-muted rounded-md animate-pulse motion-reduce:animate-none",
        className,
      )}
    />
  );
}

export function SkLine({ width = "100%" }: { width?: string }) {
  return <Sk className="h-3" />;
}

export function SkTableRows({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="flex flex-col">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="grid items-center gap-4 px-5 py-[14px] border-b border-border last:border-b-0"
          style={{ gridTemplateColumns: `28px ${"1fr ".repeat(cols)}80px` }}
        >
          <Sk className="size-4" />
          {Array.from({ length: cols }).map((__, j) => (
            <Sk key={j} className="h-3" />
          ))}
          <div className="flex gap-1 justify-end">
            <Sk className="size-6" />
            <Sk className="size-6" />
          </div>
        </div>
      ))}
    </div>
  );
}
