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
  size?: "sm" | "md" | "lg" | "xl";
}

export function GroupIcon({ icon, className, size = "md" }: GroupIconProps) {
  const lookup = icon ? ICON_MAP[icon.toLowerCase()] : undefined;
  const Icon: LucideIcon = lookup ?? HardDrive;
  const tileSize =
    size === "xl"
      ? "size-14 rounded-[14px] bg-card text-primary shadow-[0_2px_8px_rgba(16,24,40,0.08)]"
      : size === "lg"
        ? "size-[54px] rounded-[14px] bg-secondary text-secondary-foreground"
        : size === "sm"
          ? "size-6 rounded-md bg-secondary text-secondary-foreground"
          : "size-9 rounded-[8px] bg-secondary text-secondary-foreground";
  const iconSize =
    size === "xl"
      ? "size-[26px]"
      : size === "lg"
        ? "size-7"
        : size === "sm"
          ? "size-3.5"
          : "size-[18px]";
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        tileSize,
        className
      )}
      aria-hidden
    >
      <Icon className={iconSize} />
    </span>
  );
}
