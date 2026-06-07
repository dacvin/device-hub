"use client";

import { Download, Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTopbar } from "@/components/app/page-topbar";

interface Props {
  title: string;
  subtitle: string;
  metaLine: string;
  addLabel: string;
  onAdd: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  children: ReactNode;
}

export function CatalogPageShell({
  title,
  subtitle,
  metaLine,
  addLabel,
  onAdd,
  search,
  onSearchChange,
  children,
}: Props) {
  const tCommon = useTranslations("common");
  return (
    <>
      <PageTopbar
        title={title}
        crumb={subtitle}
        actions={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={tCommon("search")}
                className="h-9 w-[260px] pl-8"
              />
            </div>
            <Button variant="outline" size="sm">
              <Download className="size-4" /> {tCommon("export")}
            </Button>
            <Button size="sm" onClick={onAdd}>
              <Plus className="size-4" /> {addLabel}
            </Button>
          </>
        }
      />
      <div className="px-7 py-7">
        <div className="text-[13px] text-muted-foreground mb-3">{metaLine}</div>
        {children}
      </div>
    </>
  );
}
