"use client";

import { cn } from "@/lib/cn";
import { useRef, type KeyboardEvent } from "react";

export type KitTab = "overview" | "fit" | "questions" | "flashcards" | "schedule" | "practice";

const tabs: { id: KitTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "questions", label: "Questions" },
  { id: "flashcards", label: "Flashcards" },
  { id: "schedule", label: "Schedule" },
  { id: "practice", label: "Practice" },
  { id: "fit", label: "Your fit" },
];

export function kitTabId(tab: KitTab) {
  return `kit-tab-${tab}`;
}

export function kitTabPanelId(tab: KitTab) {
  return `kit-tabpanel-${tab}`;
}

export function KitTabs({
  active,
  onChange,
}: {
  active: KitTab;
  onChange: (tab: KitTab) => void;
}) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function focusTab(index: number) {
    const next = tabs[index];
    if (!next) return;
    onChange(next.id);
    tabRefs.current[index]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex = index;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        nextIndex = (index + 1) % tabs.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        nextIndex = (index - 1 + tabs.length) % tabs.length;
        break;
      case "Home":
        event.preventDefault();
        nextIndex = 0;
        break;
      case "End":
        event.preventDefault();
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    focusTab(nextIndex);
  }

  return (
    <div
      role="tablist"
      aria-label="Kit sections"
      aria-orientation="horizontal"
      className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-muted/30 p-1"
    >
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          ref={(element) => {
            tabRefs.current[index] = element;
          }}
          id={kitTabId(tab.id)}
          role="tab"
          type="button"
          aria-selected={active === tab.id}
          aria-controls={kitTabPanelId(tab.id)}
          tabIndex={active === tab.id ? 0 : -1}
          onClick={() => onChange(tab.id)}
          onKeyDown={(event) => handleKeyDown(event, index)}
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
