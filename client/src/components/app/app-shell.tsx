"use client";

import { Sidebar } from "@/components/app/sidebar";
import { AvatarMenu } from "@/components/app/avatar-menu";
import { MobileBottomNav } from "@/components/app/mobile-bottom-nav";
import { ConfirmProvider } from "@/hooks/use-confirm";
import { useCurrentUser } from "@/features/members/hooks/use-members";
import { deriveInitials } from "@/features/members/types";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: me } = useCurrentUser();

  const sidebarUser = {
    id: me?.id ?? "",
    name: me?.name ?? "User",
    email: me?.email ?? "",
    role: me?.role ?? "member",
    initials: deriveInitials(me?.name ?? "U"),
  };

  return (
    <ConfirmProvider>
      <div className="min-h-screen flex bg-background text-foreground">
        <Sidebar user={sidebarUser} />
        <div className="flex-1 min-w-0 flex flex-col">
          <main className="flex-1 min-w-0 pb-24 min-[980px]:pb-0">
            <div className="max-w-[1320px] mx-auto">{children}</div>
          </main>
        </div>
        <div className="fixed top-3 right-3 z-30 min-[980px]:hidden">
          <AvatarMenu variant="icon" user={sidebarUser} />
        </div>
        <MobileBottomNav />
      </div>
    </ConfirmProvider>
  );
}
