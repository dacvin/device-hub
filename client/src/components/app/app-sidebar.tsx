'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useTranslations } from 'next-intl';

import { HubMark } from '@/components/app-wordmark';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';

import { AccountMenu } from './account-menu';
import { isNavItemActive, NAV_ITEMS } from './nav-items';

export function AppSidebar({ user }: { user: { name: string; email: string } }) {
  const pathname = usePathname();
  const t = useTranslations('nav');

  return (
    <Sidebar>
      <SidebarHeader className="p-3">
        <Link href="/" className="flex items-center gap-2.5 p-1">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
            <HubMark className="size-5" />
          </div>
          <span className="text-base font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            DeviceHub
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel>{t('sectionLabel')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {NAV_ITEMS.map((item) => {
                const active = isNavItemActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      size="lg"
                      isActive={active}
                      tooltip={t(item.labelKey)}
                      className="group/nav data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:hover:bg-sidebar-primary data-[active=true]:hover:text-sidebar-primary-foreground gap-3"
                    >
                      <Link href={item.href}>
                        <span className="bg-sidebar-accent/60 text-sidebar-foreground/80 group-data-[active=true]/nav:bg-sidebar-primary-foreground/15 group-data-[active=true]/nav:text-sidebar-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-md transition-colors">
                          <Icon className="size-4.5" />
                        </span>
                        <span className="grid flex-1 leading-tight">
                          <span className="font-medium">{t(item.labelKey)}</span>
                          <span className="text-sidebar-foreground/50 group-data-[active=true]/nav:text-sidebar-primary-foreground/70 truncate text-xs">
                            {t(item.descKey)}
                          </span>
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <AccountMenu name={user.name} email={user.email} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
