"use client";

import { useEffect, useRef, useState } from "react";
import {
  Building2,
  Palette,
  Boxes,
  Bell,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SectionNavProps {
  labels: {
    general: string;
    appearance: string;
    inventory: string;
    notifications: string;
    data: string;
  };
}

export function SectionNav({ labels }: SectionNavProps) {
  const [activeId, setActiveId] = useState("general");
  const isManualScroll = useRef(false);

  const items: NavItem[] = [
    { id: "general", label: labels.general, icon: <Building2 className="size-4" /> },
    { id: "appearance", label: labels.appearance, icon: <Palette className="size-4" /> },
    { id: "inventory", label: labels.inventory, icon: <Boxes className="size-4" /> },
    { id: "notifications", label: labels.notifications, icon: <Bell className="size-4" /> },
    { id: "data", label: labels.data, icon: <Database className="size-4" /> },
  ];

  useEffect(() => {
    const sectionEls = items.map((item) => document.getElementById(item.id));

    const spy = () => {
      if (isManualScroll.current) return;
      let idx = 0;
      sectionEls.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= 120) idx = i;
      });
      setActiveId(items[idx]?.id ?? "general");
    };

    window.addEventListener("scroll", spy, { passive: true });
    spy();
    return () => window.removeEventListener("scroll", spy);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClick(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    isManualScroll.current = true;
    setActiveId(id);
    window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
    setTimeout(() => {
      isManualScroll.current = false;
    }, 800);
  }

  return (
    <nav className="sticky top-[92px] flex flex-col gap-0.5">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => handleClick(item.id)}
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-md text-[13.5px] font-medium transition-colors text-left",
            activeId === item.id
              ? "bg-secondary text-secondary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </nav>
  );
}
