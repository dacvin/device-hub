"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Boxes,
  Factory,
  HardDrive,
  Layers,
  LayoutDashboard,
  Menu,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface TabLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
}

function TabLink({ href, icon: Icon, label, active }: TabLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center py-2.5 text-[11px] gap-1",
        active ? "text-primary" : "text-muted-foreground"
      )}
    >
      <Icon className="size-5" aria-hidden />
      <span>{label}</span>
    </Link>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const tNav = useTranslations("nav");

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 min-[980px]:hidden border-t border-border bg-background/[0.95] backdrop-blur"
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-4 items-center pb-[env(safe-area-inset-bottom)]">
        <TabLink
          href="/"
          icon={LayoutDashboard}
          label={tNav("overview")}
          active={isActive("/")}
        />
        <TabLink
          href="/devices"
          icon={HardDrive}
          label={tNav("devices")}
          active={isActive("/devices")}
        />
        <TabLink
          href="/members"
          icon={Users}
          label={tNav("members")}
          active={isActive("/members")}
        />
        <MoreSheet pathname={pathname} />
      </div>
    </nav>
  );
}

function MoreSheet({ pathname }: { pathname: string }) {
  const tNav = useTranslations("nav");
  const tMore = useTranslations("mobileNav");

  const items: { href: string; icon: LucideIcon; label: string }[] = [
    { href: "/catalog/groups", icon: Layers, label: tNav("groups") },
    { href: "/catalog/units", icon: Boxes, label: tNav("units") },
    { href: "/catalog/manufacturers", icon: Factory, label: tNav("manufacturers") },
  ];

  const anyActive = items.some((i) => pathname.startsWith(i.href));

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex flex-col items-center justify-center py-2.5 text-[11px] gap-1",
            anyActive ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Menu className="size-5" aria-hidden />
          <span>{tMore("more")}</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader>
          <SheetTitle>{tMore("moreTitle")}</SheetTitle>
        </SheetHeader>
        <ul className="mt-4 space-y-1">
          {items.map(({ href, icon: Icon, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center gap-3 rounded-md px-3 py-3 text-sm hover:bg-muted"
              >
                <Icon className="size-5 text-muted-foreground" aria-hidden />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
