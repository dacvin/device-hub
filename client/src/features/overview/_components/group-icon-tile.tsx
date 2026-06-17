import {
  HardDrive,
  Laptop,
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
};

function resolveIcon(input: string | null | undefined, groupName: string): LucideIcon {
  if (input && ICON_MAP[input]) return ICON_MAP[input];
  const fallbackByGroup: Record<string, string> = {
    Laptop: "laptop",
    Desktop: "monitor",
    Monitor: "monitor",
    Printer: "printer",
    Network: "network",
    Server: "server",
    Mobile: "smartphone",
    Peripheral: "webcam",
  };
  const key = fallbackByGroup[groupName];
  return (key && ICON_MAP[key]) || HardDrive;
}

interface GroupIconTileProps {
  icon?: string | null;
  groupName: string;
  size?: "sm" | "md";
  className?: string;
}

export function GroupIconTile({
  icon,
  groupName,
  size = "sm",
  className,
}: GroupIconTileProps) {
  const Icon = resolveIcon(icon, groupName);
  return (
    <span
      className={cn(
        "rounded-[7px] bg-secondary text-secondary-foreground grid place-items-center shrink-0",
        size === "sm" ? "size-[26px]" : "size-[34px] rounded-[9px]",
        className,
      )}
    >
      <Icon className={size === "sm" ? "size-[14px]" : "size-4"} aria-hidden />
    </span>
  );
}
