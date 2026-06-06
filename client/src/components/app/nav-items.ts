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
  // i18n key under "nav" namespace
  labelKey: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  // i18n key under "sidebar" namespace
  labelKey: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: "groupMain",
    items: [
      { labelKey: "overview", href: "/overview", icon: LayoutDashboard },
      { labelKey: "devices", href: "/devices", icon: HardDrive },
    ],
  },
  {
    labelKey: "groupCatalog",
    items: [
      { labelKey: "departments", href: "/departments", icon: Building2 },
      { labelKey: "groups", href: "/groups", icon: Layers },
      { labelKey: "manufacturers", href: "/manufacturers", icon: Factory },
    ],
  },
  {
    labelKey: "groupSystem",
    items: [
      { labelKey: "members", href: "/members", icon: Users },
      { labelKey: "settings", href: "/settings", icon: Settings },
    ],
  },
];
