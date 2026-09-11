"use client";

import { cn } from "@/lib/cn";
import { ChevronDown } from "lucide-react";
import { ReactNode, createContext, useContext, useState } from "react";

const CollapsibleCtx = createContext<{
  open: boolean;
  setOpen: (v: boolean) => void;
} | null>(null);

export function Collapsible({
  children,
  defaultOpen = true,
  className,
}: {
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <CollapsibleCtx.Provider value={{ open, setOpen }}>
      <div className={className}>{children}</div>
    </CollapsibleCtx.Provider>
  );
}

export function CollapsibleTrigger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ctx = useContext(CollapsibleCtx);
  if (!ctx) throw new Error("CollapsibleTrigger must be inside Collapsible");

  return (
    <button
      type="button"
      aria-expanded={ctx.open}
      onClick={() => ctx.setOpen(!ctx.open)}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer",
        className,
      )}
    >
      {children}
      <ChevronDown
        className={cn("h-3.5 w-3.5 transition-transform duration-200", ctx.open && "rotate-180")}
        aria-hidden
      />
    </button>
  );
}

export function CollapsibleContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ctx = useContext(CollapsibleCtx);
  if (!ctx) throw new Error("CollapsibleContent must be inside Collapsible");
  if (!ctx.open) return null;
  return <div className={className}>{children}</div>;
}
