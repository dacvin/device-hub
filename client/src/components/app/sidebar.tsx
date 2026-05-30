"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/app/brand-mark";
import { NAV_GROUPS } from "@/components/app/nav-items";
import { cn } from "@/lib/utils";

export interface SidebarUser {
  name: string;
  email: string;
  initials: string;
}

export function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="hidden lg:flex flex-col w-[248px] shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="px-5 pt-6 pb-3">
        <BrandMark />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="px-2 mb-1 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              {group.label}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <Icon className="size-4" aria-hidden />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="m-3 mt-2 rounded-lg border border-sidebar-border bg-sidebar/80 backdrop-blur p-2.5 flex items-center gap-2.5">
        <div
          className={cn(
            "size-8 rounded-full bg-primary text-primary-foreground",
            "flex items-center justify-center text-xs font-semibold"
          )}
          aria-hidden
        >
          {user.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">{user.name}</div>
          <div className="text-[11px] text-muted-foreground truncate">{user.email}</div>
        </div>
      </div>
    </aside>
  );
}
