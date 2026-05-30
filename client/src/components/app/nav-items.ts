import {
  Building2,
  Factory,
  HardDrive,
  Layers,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Main",
    items: [
      { label: "Overview", href: "/overview", icon: LayoutDashboard },
      { label: "Devices", href: "/devices", icon: HardDrive },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Departments", href: "/departments", icon: Building2 },
      { label: "Groups", href: "/groups", icon: Layers },
      { label: "Manufacturers", href: "/manufacturers", icon: Factory },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Members", href: "/members", icon: Users },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];
