import { HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
  size?: "sm" | "md";
}

export function BrandMark({ className, size = "md" }: BrandMarkProps) {
  const glyph =
    size === "sm" ? "size-6 rounded-[7px]" : "size-[30px] rounded-md";
  const icon = size === "sm" ? "size-3.5" : "size-[18px]";
  const text = size === "sm" ? "text-sm" : "text-[17px]";
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 font-semibold tracking-[-0.02em]",
        text,
        className
      )}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center bg-sidebar-primary text-sidebar-primary-foreground",
          glyph
        )}
      >
        <HardDrive className={icon} aria-hidden />
      </span>
      <span>
        <span>Device</span>
        <span className="text-sidebar-primary">Hub</span>
      </span>
    </div>
  );
}
