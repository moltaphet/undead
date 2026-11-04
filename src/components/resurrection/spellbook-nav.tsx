"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export interface NavItem {
  id: string;
  label: string;
}

/** Sticky side nav on desktop, sticky pill bar on mobile, with scroll-spy. */
export function SpellbookNav({ items }: { items: NavItem[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    items.forEach((i) => {
      const el = document.getElementById(i.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="Spellbook sections" className="sticky top-0 z-20 -mx-4 bg-background/90 px-4 py-2 backdrop-blur lg:top-8 lg:mx-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
      <ol className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1 lg:overflow-visible">
        {items.map((item, i) => (
          <li key={item.id} className="shrink-0">
            <a
              href={`#${item.id}`}
              aria-current={active === item.id ? "location" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm whitespace-nowrap transition lg:rounded-lg lg:border-transparent lg:px-3",
                active === item.id
                  ? "border-primary/60 text-primary lg:bg-surface"
                  : "border-border text-muted hover:text-foreground",
              )}
            >
              <span aria-hidden="true" className="hidden font-mono text-xs text-muted lg:inline">
                {String(i + 1).padStart(2, "0")}
              </span>
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
