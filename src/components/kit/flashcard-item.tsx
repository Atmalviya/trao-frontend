"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import type { Flashcard } from "@/lib/types";
import {
  FlipHorizontal2,
  Pencil,
  Pin,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  measureFlashcardSides,
  type FlashcardSceneLayout,
} from "@/lib/flashcard-layout";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

function originTone(origin: Flashcard["origin"]) {
  if (origin === "manual") return "accent" as const;
  if (origin === "edited") return "warning" as const;
  return "muted" as const;
}

export function FlashcardItem({
  card,
  index,
  isEditing,
  isSaving,
  isDeleting,
  isPinning,
  onStartEdit,
  onCancelEdit,
  onSave,
  onTogglePin,
  onDelete,
}: {
  card: Flashcard;
  index: number;
  isEditing: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  isPinning: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (patch: { front: string; back: string }) => void;
  onTogglePin: () => void;
  onDelete: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [draftFront, setDraftFront] = useState(card.front);
  const [draftBack, setDraftBack] = useState(card.back);
  const sceneRef = useRef<HTMLButtonElement>(null);
  const [sceneLayout, setSceneLayout] = useState<FlashcardSceneLayout>({
    height: 120,
    scrollable: false,
    contentMaxHeight: undefined,
  });

  const updateSceneLayout = useCallback(() => {
    const width = sceneRef.current?.clientWidth ?? 0;
    setSceneLayout(
      measureFlashcardSides(card.front, card.back, width, flipped),
    );
  }, [card.back, card.front, flipped]);

  useLayoutEffect(() => {
    updateSceneLayout();
  }, [updateSceneLayout, flipped, card.front, card.back]);

  useEffect(() => {
    window.addEventListener("resize", updateSceneLayout);
    return () => window.removeEventListener("resize", updateSceneLayout);
  }, [updateSceneLayout]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const observer = new ResizeObserver(() => updateSceneLayout());
    observer.observe(scene);
    return () => observer.disconnect();
  }, [updateSceneLayout]);

  useEffect(() => {
    if (!isEditing) {
      setDraftFront(card.front);
      setDraftBack(card.back);
      setFlipped(false);
    }
  }, [card.front, card.back, isEditing]);

  const canSave =
    draftFront.trim().length > 0 &&
    (draftFront !== card.front || draftBack !== card.back);

  if (isEditing) {
    return (
      <article
        className="flex flex-col overflow-hidden rounded-xl border border-accent/40 bg-card shadow-lg shadow-black/20"
        aria-label={`Editing flashcard ${index + 1}`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border/80 bg-accent/5 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Card {index + 1}
            </span>
            <Badge tone={originTone(card.origin)}>{card.origin}</Badge>
            {card.pinned ? <Badge tone="success">pinned</Badge> : null}
          </div>
          <Badge tone="accent">Editing</Badge>
        </div>

        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <label htmlFor={`front-${card.id}`} className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Front
            </label>
            <Textarea
              id={`front-${card.id}`}
              value={draftFront}
              onChange={(e) => setDraftFront(e.target.value)}
              rows={3}
              autoFocus
              placeholder="Question or prompt"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`back-${card.id}`} className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Back
            </label>
            <Textarea
              id={`back-${card.id}`}
              value={draftBack}
              onChange={(e) => setDraftBack(e.target.value)}
              rows={4}
              placeholder="Answer or explanation"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/80 bg-muted/20 px-4 py-3">
          <Button type="button" variant="ghost" size="sm" onClick={onCancelEdit} disabled={isSaving}>
            <X className="h-4 w-4" aria-hidden />
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!canSave || isSaving}
            onClick={() => onSave({ front: draftFront.trim(), back: draftBack.trim() })}
          >
            <Save className="h-4 w-4" aria-hidden />
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border bg-card transition-colors duration-200",
        card.pinned
          ? "border-accent/40 shadow-md shadow-accent/5"
          : "border-border hover:border-border/80",
      )}
      aria-label={`Flashcard ${index + 1}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            #{index + 1}
          </span>
          <Badge tone={originTone(card.origin)}>{card.origin}</Badge>
          {card.pinned ? <Badge tone="success">pinned</Badge> : null}
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
          {flipped ? "Answer" : "Prompt"}
        </span>
      </div>

      <div className="p-4">
        <button
          ref={sceneRef}
          type="button"
          onClick={() => {
            setFlipped((f) => !f);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setFlipped((f) => !f);
            }
          }}
          aria-expanded={flipped}
          aria-label={flipped ? "Show prompt" : "Reveal answer"}
          className={cn(
            "flashcard-scene mx-auto block w-full cursor-pointer rounded-xl transition-[height] duration-300 ease-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
          )}
          style={{ height: sceneLayout.height }}
        >
          <div className={cn("flashcard-inner h-full", flipped && "is-flipped")}>
            <div className="flashcard-face flashcard-front flex flex-col overflow-hidden rounded-xl border border-border/80 bg-gradient-to-b from-muted/50 to-muted/20 p-4">
              <span className="shrink-0 self-center rounded-full bg-background/60 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Prompt
              </span>
              <div
                className={cn(
                  "mt-3 text-center",
                  !flipped && sceneLayout.scrollable && "flashcard-scroll overflow-y-auto overscroll-contain",
                )}
                style={
                  !flipped && sceneLayout.scrollable
                    ? { maxHeight: sceneLayout.contentMaxHeight }
                    : undefined
                }
              >
                <p className="text-sm font-medium leading-relaxed text-foreground whitespace-pre-wrap">
                  {card.front || "Empty prompt"}
                </p>
              </div>
              <span className="mt-3 flex shrink-0 items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <FlipHorizontal2 className="h-3.5 w-3.5" aria-hidden />
                Tap to reveal
              </span>
            </div>
            <div className="flashcard-face flashcard-back flex flex-col overflow-hidden rounded-xl border border-accent/30 bg-gradient-to-b from-accent/15 to-accent/5 p-4">
              <span className="shrink-0 self-center rounded-full bg-accent/20 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
                Answer
              </span>
              <div
                className={cn(
                  "mt-3 text-left",
                  flipped && sceneLayout.scrollable && "flashcard-scroll overflow-y-auto overscroll-contain",
                )}
                style={
                  flipped && sceneLayout.scrollable
                    ? { maxHeight: sceneLayout.contentMaxHeight }
                    : undefined
                }
              >
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {card.back || "No answer yet"}
                </p>
              </div>
              <span className="mt-3 flex shrink-0 items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                Tap to flip back
              </span>
            </div>
          </div>
        </button>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border/60 bg-muted/10 px-3 py-2.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onStartEdit}
          aria-label="Edit flashcard"
        >
          <Pencil className="h-4 w-4" aria-hidden />
          Edit
        </Button>
        <div className="flex gap-1">
          <Button
            type="button"
            variant={card.pinned ? "secondary" : "ghost"}
            size="sm"
            disabled={isPinning}
            onClick={onTogglePin}
            aria-label={card.pinned ? "Unpin flashcard" : "Pin flashcard"}
          >
            <Pin className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isDeleting}
            onClick={onDelete}
            aria-label="Delete flashcard"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>
    </article>
  );
}
