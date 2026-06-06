import { HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
  size?: "sm" | "md";
}

export function BrandMark({ className, size = "md" }: BrandMarkProps) {
  const glyph =
    size === "sm" ? "size-6 rounded-[7px]" : "size-[30px] rounded-[9px]";
  const icon = size === "sm" ? "size-3.5" : "size-4";
  const text = size === "sm" ? "text-sm" : "text-base";
  return (
    <div className={cn("inline-flex items-center gap-2 font-semibold", text, className)}>
      <span
        className={cn(
          "inline-flex items-center justify-center bg-primary text-primary-foreground",
          glyph
        )}
      >
        <HardDrive className={icon} aria-hidden />
      </span>
      <span className="tracking-tight">
        <span>Device</span>
        <span className="text-primary">Hub</span>
      </span>
    </div>
  );
}
