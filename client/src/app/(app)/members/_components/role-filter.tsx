"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface RoleFilterProps {
  labels: {
    all: string;
    admins: string;
    managers: string;
    viewers: string;
  };
  currentRole?: string;
}

export function RoleFilter({ labels, currentRole }: RoleFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value || value === "all") {
        params.delete("role");
      } else {
        params.set("role", value);
      }
      // Reset to page 1 if paginated in future
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const value = currentRole && currentRole !== "all" ? currentRole : "all";

  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => handleChange(v || "all")}
      className="bg-muted rounded-[var(--radius-md)] p-[3px] gap-[2px] h-auto"
    >
      <ToggleGroupItem
        value="all"
        className="h-[30px] rounded-[calc(var(--radius-md)-2px)] px-3 text-[13px] font-medium data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm text-muted-foreground"
      >
        {labels.all}
      </ToggleGroupItem>
      <ToggleGroupItem
        value="it_admin"
        className="h-[30px] rounded-[calc(var(--radius-md)-2px)] px-3 text-[13px] font-medium data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm text-muted-foreground"
      >
        {labels.admins}
      </ToggleGroupItem>
      <ToggleGroupItem
        value="manager"
        className="h-[30px] rounded-[calc(var(--radius-md)-2px)] px-3 text-[13px] font-medium data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm text-muted-foreground"
      >
        {labels.managers}
      </ToggleGroupItem>
      <ToggleGroupItem
        value="viewer"
        className="h-[30px] rounded-[calc(var(--radius-md)-2px)] px-3 text-[13px] font-medium data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm text-muted-foreground"
      >
        {labels.viewers}
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
