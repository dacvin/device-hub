import {
  Boxes,
  Factory,
  HardDrive,
  Layers,
  LayoutDashboard,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  /** i18n key under "nav" namespace */
  labelKey: string;
  href: string;
  icon: LucideIcon;
  /** When set, this nav item shows a trailing count pill (e.g. devices total). */
  countKind?: "devices";
}

export interface NavGroup {
  /** i18n key under "sidebar" namespace */
  labelKey: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: "groupMain",
    items: [
      { labelKey: "overview", href: "/", icon: LayoutDashboard },
      { labelKey: "devices", href: "/devices", icon: HardDrive, countKind: "devices" },
    ],
  },
  {
    labelKey: "groupCatalog",
    items: [
      { labelKey: "groups", href: "/catalog/groups", icon: Layers },
      { labelKey: "units", href: "/catalog/units", icon: Boxes },
      { labelKey: "manufacturers", href: "/catalog/manufacturers", icon: Factory },
    ],
  },
  {
    labelKey: "groupSystem",
    items: [
      { labelKey: "members", href: "/members", icon: Users },
    ],
  },
];
