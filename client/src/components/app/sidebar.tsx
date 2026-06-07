"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { BrandMark } from "@/components/app/brand-mark";
import { NAV_GROUPS } from "@/components/app/nav-items";
import { cn } from "@/lib/utils";
import { AvatarMenu } from "@/components/app/avatar-menu";

export interface SidebarUser {
  id: string;
  name: string;
  email: string;
  initials: string;
}

export function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const tSidebar = useTranslations("sidebar");
  const tNav = useTranslations("nav");

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="hidden min-[980px]:flex flex-col sticky top-0 h-screen w-[248px] shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="px-[18px] pt-[18px] pb-4">
        <BrandMark />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-1.5">
        {NAV_GROUPS.map((group) => (
          <div key={group.labelKey}>
            <div
              className="px-2.5 pt-3.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground first:pt-1.5"
            >
              {tSidebar(group.labelKey)}
            </div>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground [&_svg]:text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent"
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-[17px]",
                          active ? "" : "text-muted-foreground"
                        )}
                        aria-hidden
                      />
                      <span>{tNav(item.labelKey)}</span>
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
