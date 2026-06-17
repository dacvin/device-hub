"use client";

import { use } from "react";
import { PageShell } from "@/components/app/page-shell";
import { MemberProfileClient } from "./_components/member-profile-client";

export default function MemberProfilePage({
  params,
}: {
  params: Promise<{ email: string }>;
}) {
  const { email } = use(params);
  const decoded = decodeURIComponent(email);
  return (
    <PageShell title="Member profile">
      <MemberProfileClient email={decoded} />
    </PageShell>
  );
}
