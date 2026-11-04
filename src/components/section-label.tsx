import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function SectionLabel({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <h2 id={id} className={cn("font-mono text-xs font-medium uppercase tracking-[0.25em] text-muted", className)}>
      {children}
    </h2>
  );
}
