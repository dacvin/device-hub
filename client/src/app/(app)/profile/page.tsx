"use client";

import { redirect } from "next/navigation";
import { PageShell } from "@/components/app/page-shell";
import { useCurrentUser } from "@/features/members/hooks/use-members";
import { ProfileClient } from "./_components/profile-client";
import { Sk } from "@/components/app/skeletons";
import { Card } from "@/components/ui/card";

export default function ProfilePage() {
  const { data: me, isPending } = useCurrentUser();

  if (isPending) {
    return (
      <PageShell title="My profile" crumb="Update your account">
        <Card className="shadow-none p-5 max-w-[820px] mx-auto">
          <Sk className="h-3 w-32 mb-4" />
          <div className="grid grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Sk className="h-3 w-24 mb-2" />
                <Sk className="h-9 rounded-md" />
              </div>
            ))}
          </div>
        </Card>
      </PageShell>
    );
  }

  if (!me) {
    redirect("/login");
  }

  return (
    <PageShell title="My profile" crumb="Update your account">
      <ProfileClient member={me} />
    </PageShell>
  );
}
