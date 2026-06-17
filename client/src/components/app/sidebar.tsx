"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { BrandMark } from "@/components/app/brand-mark";
import { NAV_GROUPS, type NavItem } from "@/components/app/nav-items";
import { cn } from "@/lib/utils";
import { AvatarMenu } from "@/components/app/avatar-menu";
import { useDevices } from "@/features/devices/hooks/use-devices";

export interface SidebarUser {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
}

interface SidebarProps {
  user: SidebarUser;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const tSidebar = useTranslations("sidebar");
  const tNav = useTranslations("nav");
  const { data: devicesData } = useDevices({});
  const deviceCount = devicesData?.totalCount;

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  function countFor(item: NavItem): number | undefined {
    if (item.countKind === "devices") return deviceCount;
    return undefined;
  }

  return (
    <aside className="hidden min-[980px]:flex flex-col sticky top-0 h-screen w-[210px] shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="px-[18px] pt-[18px] pb-3">
        <Link href="/" aria-label="DeviceHub home">
          <BrandMark />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-1.5">
        {NAV_GROUPS.map((group) => (
          <div key={group.labelKey}>
            <div className="px-2.5 pt-3.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground first:pt-1.5">
              {tSidebar(group.labelKey)}
            </div>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                const count = countFor(item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-[9px] text-[13px] font-medium transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-[17px]",
                          active ? "" : "text-muted-foreground"
                        )}
                        aria-hidden
                      />
                      <span className="flex-1">{tNav(item.labelKey)}</span>
                      {count !== undefined && count > 0 ? (
                        <span className="text-[11px] font-semibold rounded-full bg-secondary text-secondary-foreground px-1.5 py-0.5 leading-none tabular-nums">
                          {count}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-auto p-3 border-t border-sidebar-border">
        <AvatarMenu user={user} />
      </div>
    </aside>
  );
}
