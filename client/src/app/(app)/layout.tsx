import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar, type SidebarUser } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import { Toaster } from "@/components/ui/sonner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sidebarUser: SidebarUser = {
    name:
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      user.email ??
      "User",
    email: user.email ?? "",
    initials: deriveInitials(
      (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "U"
    ),
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar user={sidebarUser} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <main className="flex-1 px-7 py-7">
          <div className="max-w-[1320px] mx-auto">{children}</div>
        </main>
      </div>
      <Toaster richColors position="bottom-right" />
    </div>
  );
}

function deriveInitials(s: string): string {
  const parts = s.replace(/@.+$/, "").split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
