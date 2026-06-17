"use client";

import Link from "next/link";
import { ArrowLeft, History, IdCard, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MemberStatusBadge, RoleBadge } from "@/components/app/role-badge";
import { DefinitionList } from "@/app/(app)/devices/[code]/_components/section-card";
import { deriveInitials, relativeLastActive } from "@/features/members/types";
import { useMemberByEmail } from "@/features/members/hooks/use-members";
import { formatDate } from "@/lib/format-date";
import { Sk } from "@/components/app/skeletons";
import { MemberActions } from "./member-actions";

export function MemberProfileClient({ email }: { email: string }) {
  const { data: member, isPending } = useMemberByEmail(email);

  if (isPending) {
    return (
      <>
        <Sk className="h-3 w-32 mb-5" />
        <div className="flex items-start gap-5 mb-5">
          <Sk className="size-14 rounded-full" />
          <div className="flex-1">
            <Sk className="h-6 w-48 mb-2" />
            <Sk className="h-3 w-72" />
          </div>
          <Sk className="h-9 w-40 rounded-md" />
        </div>
        <Card className="shadow-none py-0 px-5 py-5">
          <Sk className="h-3 w-24 mb-4" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Sk className="h-2.5 w-20 mb-2" />
                <Sk className="h-3 w-32" />
              </div>
            ))}
          </div>
        </Card>
      </>
    );
  }

  if (!member) {
    return (
      <>
        <Link
          href="/members"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground mb-5"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Back to members
        </Link>
        <Card className="py-12 shadow-none">
          <div className="flex flex-col items-center text-center px-5">
            <span className="size-12 rounded-xl bg-secondary text-secondary-foreground grid place-items-center mb-4">
              <UserX className="size-5" aria-hidden />
            </span>
            <h2 className="text-[16px] font-semibold tracking-[-0.01em]">
              Profile not found
            </h2>
            <p className="text-[13px] text-muted-foreground mt-1 max-w-sm">
              We couldn&apos;t find that member. They may have been removed, or the link is out of date.
            </p>
            <Button asChild className="mt-5">
              <Link href="/members">Back to members</Link>
            </Button>
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <Link
        href="/members"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground mb-5"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to members
      </Link>

      <div className="flex flex-wrap items-start gap-5 mb-5">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <span className="size-14 rounded-full bg-primary text-primary-foreground grid place-items-center text-[15px] font-semibold shrink-0">
            {deriveInitials(member.name)}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-[24px] leading-tight font-semibold tracking-[-0.02em]">
                {member.name}
              </h1>
              {member.isSelf ? (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  You
                </Badge>
              ) : null}
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-1.5 text-[12.5px]">
              <span className="font-mono text-muted-foreground">{member.email}</span>
              <span className="h-3 w-px bg-border" aria-hidden />
              <RoleBadge role={member.role} />
              <MemberStatusBadge status={member.status} />
            </div>
          </div>
        </div>
        <MemberActions member={member} />
      </div>

      <div className="grid gap-5 items-start grid-cols-1 min-[1080px]:[grid-template-columns:minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-5 min-w-0">
          <Card className="shadow-none gap-0 py-0">
            <div className="flex items-center gap-2 px-5 pt-5 pb-3">
              <IdCard className="size-3.5 text-muted-foreground" aria-hidden />
              <h2 className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted-foreground">
                Details
              </h2>
            </div>
            <div className="px-5 pb-5">
              <DefinitionList
                items={[
                  { label: "Email", value: member.email, mono: true },
                  { label: "Phone", value: member.phone ?? "—", mono: true },
                  {
                    label: "Member since",
                    value: member.joinedAt ? formatDate(member.joinedAt) : "—",
                  },
                  { label: "Last active", value: relativeLastActive(member.lastActiveAt) },
                ]}
              />
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card className="shadow-none gap-0 py-5">
            <div className="flex items-center gap-2 px-5 pb-3">
              <History className="size-3.5 text-muted-foreground" aria-hidden />
              <h2 className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted-foreground">
                Recent activity
              </h2>
            </div>
            <div className="px-5 text-[13px] text-muted-foreground">
              {member.status === "invited"
                ? "Invitation sent · awaiting acceptance."
                : "No activity yet."}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
