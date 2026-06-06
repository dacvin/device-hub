"use client";

import { Download, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/app/page-header";

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
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <>
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={tCommon("search")}
              className="h-9 w-[220px]"
            />
            <Button variant="outline" size="sm">
              <Download className="size-4" /> {tCommon("export")}
            </Button>
            <Button size="sm" onClick={onAdd}>
              <Plus className="size-4" /> {addLabel}
            </Button>
          </>
        }
      />
      <div className="text-xs text-muted-foreground mb-3">{metaLine}</div>
      {children}
    </>
  );
}
