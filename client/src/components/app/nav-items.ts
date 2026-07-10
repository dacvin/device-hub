import { Boxes, HardDrive, LayoutDashboard, type LucideIcon, Users } from 'lucide-react';

export interface NavItem {
  // i18n keys under the "nav" namespace
  labelKey: string;
  descKey: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { labelKey: 'dashboard', descKey: 'dashboardDesc', href: '/', icon: LayoutDashboard },
  { labelKey: 'devices', descKey: 'devicesDesc', href: '/devices', icon: HardDrive },
  { labelKey: 'catalog', descKey: 'catalogDesc', href: '/catalogs', icon: Boxes },
  { labelKey: 'members', descKey: 'membersDesc', href: '/members', icon: Users },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}
