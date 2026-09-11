"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import {
  DIFFICULTY_OPTIONS,
  difficultyBadgeTone,
  difficultyLabel,
  type Difficulty,
} from "@/lib/difficulty";
import type { Question, QuestionCategory } from "@/lib/types";
import { questionCategories } from "@/lib/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Pencil,
  Pin,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  technical: "Technical",
  behavioural: "Behavioural",
  "system-design": "System design",
  "company-fit": "Company fit",
};

function originTone(origin: Question["origin"]) {
  if (origin === "manual") return "accent" as const;
  if (origin === "edited") return "warning" as const;
  return "muted" as const;
}

export type QuestionSavePayload = {
  prompt: string;
  answer_outline: string;
  category: QuestionCategory;
  difficulty: number;
};

export function QuestionItem({
  question,
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
  question: Question;
  isEditing: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  isPinning: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (patch: QuestionSavePayload) => void;
  onTogglePin: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [draftPrompt, setDraftPrompt] = useState(question.prompt);
  const [draftOutline, setDraftOutline] = useState(question.answer_outline);
  const [draftCategory, setDraftCategory] = useState(question.category);
  const [draftDifficulty, setDraftDifficulty] = useState(question.difficulty);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: question.id, disabled: isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    if (!isEditing) {
      setDraftPrompt(question.prompt);
      setDraftOutline(question.answer_outline);
      setDraftCategory(question.category);
      setDraftDifficulty(question.difficulty);
    }
  }, [
    question.prompt,
    question.answer_outline,
    question.category,
    question.difficulty,
    isEditing,
  ]);

  const canSave =
    draftPrompt.trim().length > 0 &&
    (draftPrompt !== question.prompt ||
      draftOutline !== question.answer_outline ||
      draftCategory !== question.category ||
      draftDifficulty !== question.difficulty);

  if (isEditing) {
    return (
      <article
        ref={setNodeRef}
        style={style}
        className={cn(
          "overflow-hidden rounded-xl border border-accent/40 bg-card shadow-lg shadow-black/20",
          isDragging && "opacity-60",
        )}
        aria-label="Editing question"
      >
        <div className="flex items-center justify-between gap-2 border-b border-border/80 bg-accent/5 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={originTone(question.origin)}>{question.origin}</Badge>
            {question.pinned ? <Badge tone="success">pinned</Badge> : null}
          </div>
          <Badge tone="accent">Editing</Badge>
        </div>

        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <label
              htmlFor={`prompt-${question.id}`}
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Question
            </label>
            <Textarea
              id={`prompt-${question.id}`}
              value={draftPrompt}
              onChange={(e) => setDraftPrompt(e.target.value)}
              rows={3}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor={`outline-${question.id}`}
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Answer outline
            </label>
            <Textarea
              id={`outline-${question.id}`}
              value={draftOutline}
              onChange={(e) => setDraftOutline(e.target.value)}
              rows={4}
              placeholder="Key points to cover in your answer"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor={`category-${question.id}`}
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                Category
              </label>
              <select
                id={`category-${question.id}`}
                value={draftCategory}
                onChange={(e) =>
                  setDraftCategory(e.target.value as QuestionCategory)
                }
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm cursor-pointer"
              >
                {questionCategories.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label
                htmlFor={`difficulty-${question.id}`}
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                Difficulty
              </label>
              <select
                id={`difficulty-${question.id}`}
                value={draftDifficulty}
                onChange={(e) =>
                  setDraftDifficulty(Number(e.target.value) as Difficulty)
                }
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm cursor-pointer"
              >
                {DIFFICULTY_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/80 bg-muted/20 px-4 py-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancelEdit}
            disabled={isSaving}
          >
            <X className="h-4 w-4" aria-hidden />
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!canSave || isSaving}
            onClick={() =>
              onSave({
                prompt: draftPrompt.trim(),
                answer_outline: draftOutline.trim(),
                category: draftCategory,
                difficulty: draftDifficulty,
              })
            }
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
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-xl border bg-card transition-colors duration-200",
        question.pinned
          ? "border-accent/40 shadow-sm shadow-accent/5"
          : "border-border hover:border-border/80",
        isDragging && "opacity-60 shadow-lg",
      )}
    >
      <div className="flex gap-2 p-3">
        <button
          type="button"
          className="mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="muted">{CATEGORY_LABELS[question.category]}</Badge>
            <Badge tone={originTone(question.origin)}>{question.origin}</Badge>
            {question.pinned ? <Badge tone="success">pinned</Badge> : null}
            <Badge tone={difficultyBadgeTone(question.difficulty)}>
              {difficultyLabel(question.difficulty)}
            </Badge>
          </div>

          <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">
            {question.prompt}
          </p>

          {question.answer_outline ? (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                aria-expanded={expanded}
              >
                {expanded ? (
                  <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                )}
                Answer outline
              </button>
              {expanded ? (
                <p className="mt-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {question.answer_outline}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-xs italic text-muted-foreground/70">
              No answer outline yet
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 bg-muted/10 px-3 py-2 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        <Button type="button" variant="ghost" size="sm" onClick={onStartEdit}>
          <Pencil className="h-4 w-4" aria-hidden />
          Edit
        </Button>
        <div className="flex gap-1">
          <Button
            type="button"
            variant={question.pinned ? "secondary" : "ghost"}
            size="sm"
            disabled={isPinning}
            onClick={onTogglePin}
            aria-label={question.pinned ? "Unpin question" : "Pin question"}
          >
            <Pin className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isDeleting}
            onClick={onDelete}
            aria-label="Delete question"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>
    </article>
  );
}
