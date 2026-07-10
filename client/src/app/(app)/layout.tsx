import { Server } from 'lucide-react';

import { AppSidebar } from '@/components/app/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { getCurrentAppUser } from '@/lib/auth/current-user';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentAppUser();
  const navUser = { name: user?.name ?? 'User', email: user?.email ?? '' };

  return (
    <SidebarProvider>
      <AppSidebar user={navUser} />
      <SidebarInset className="flex h-svh min-h-0 flex-col overflow-hidden">
        <header className="bg-background/80 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur md:hidden">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded">
              <Server className="size-3.5" />
            </div>
            <span className="font-semibold tracking-tight">DeviceHub</span>
          </div>
        </header>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
