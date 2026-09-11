"use client";

import { cn } from "@/lib/cn";

export type KitTab = "overview" | "questions" | "flashcards" | "schedule" | "practice";

const tabs: { id: KitTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "questions", label: "Questions" },
  { id: "flashcards", label: "Flashcards" },
  { id: "schedule", label: "Schedule" },
  { id: "practice", label: "Practice" },
];

export function KitTabs({
  active,
  onChange,
}: {
  active: KitTab;
  onChange: (tab: KitTab) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Kit sections"
      className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-muted/30 p-1"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          type="button"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 cursor-pointer",
            active === tab.id
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
