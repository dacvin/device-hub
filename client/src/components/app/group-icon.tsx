"use client";

import {
  HardDrive,
  Laptop,
  Layers,
  Monitor,
  Network,
  Printer,
  Server,
  Smartphone,
  Webcam,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  laptop: Laptop,
  monitor: Monitor,
  printer: Printer,
  network: Network,
  server: Server,
  smartphone: Smartphone,
  webcam: Webcam,
  "hard-drive": HardDrive,
  layers: Layers,
};

interface GroupIconProps {
  icon: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function GroupIcon({ icon, className, size = "md" }: GroupIconProps) {
  const lookup = icon ? ICON_MAP[icon.toLowerCase()] : undefined;
  const Icon: LucideIcon = lookup ?? HardDrive;
  const tileSize = size === "lg" ? "size-[54px] rounded-[12px]" : size === "sm" ? "size-6 rounded-md" : "size-9 rounded-[8px]";
  const iconSize = size === "lg" ? "size-7" : size === "sm" ? "size-3.5" : "size-4";
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center bg-muted text-muted-foreground border border-border/60",
        tileSize,
        className
      )}
      aria-hidden
    >
      <Icon className={iconSize} />
    </span>
  );
}
