"use client";

import { QuestionItem, type QuestionSavePayload } from "@/components/kit/question-item";
import { QuestionItemSkeleton } from "@/components/kit/question-item-skeleton";
import { RegeneratingBanner } from "@/components/kit/regenerating-banner";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegenerateButton } from "@/components/ui/regenerate-button";
import { api } from "@/lib/api";
import type { Kit, Question, QuestionCategory } from "@/lib/types";
import { questionCategories } from "@/lib/types";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/cn";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  technical: "Technical",
  behavioural: "Behavioural",
  "system-design": "System design",
  "company-fit": "Company fit",
};

function isReplaceableOnRegen(question: Question) {
  return question.origin === "generated" && !question.pinned;
}

export function KitQuestions({ kitId, kit }: { kitId: string; kit: Kit }) {
  const queryClient = useQueryClient();
  const [localQuestions, setLocalQuestions] = useState(kit.questions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [regenCategory, setRegenCategory] = useState<QuestionCategory>("technical");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalQuestions(kit.questions);
  }, [kit.questions]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const syncQuestions = useCallback(
    (questions: Question[]) => {
      setLocalQuestions(questions);
      queryClient.setQueryData(["kit", kitId], (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        const prev = old as { kit: Kit };
        return { ...prev, kit: { ...prev.kit, questions } };
      });
    },
    [kitId, queryClient],
  );

  const grouped = useMemo(() => {
    const map = new Map<QuestionCategory, Question[]>();
    for (const cat of questionCategories) map.set(cat, []);
    for (const q of localQuestions) {
      const list = map.get(q.category) ?? [];
      list.push(q);
      map.set(q.category, list);
    }
    return map;
  }, [localQuestions]);

  const saveMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: QuestionSavePayload }) =>
      api.updateQuestion(kitId, id, patch),
    onSuccess: (res) => {
      syncQuestions(res.kit.questions);
      setEditingId(null);
      setError(null);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Could not save"),
  });

  const pinMutation = useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) =>
      api.updateQuestion(kitId, id, { pinned }),
    onSuccess: (res) => {
      syncQuestions(res.kit.questions);
      setError(null);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Could not update pin"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteQuestion(kitId, id),
    onSuccess: (res, id) => {
      syncQuestions(res.kit.questions);
      if (editingId === id) setEditingId(null);
      setError(null);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Could not delete"),
  });

  const reorderMutation = useMutation({
    mutationFn: (items: { id: string; category: string }[]) =>
      api.reorderQuestions(kitId, items),
    onSuccess: (res) => {
      syncQuestions(res.kit.questions);
      setError(null);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Reorder failed"),
  });

  const addMutation = useMutation({
    mutationFn: (category: QuestionCategory) =>
      api.addQuestion(kitId, {
        prompt: "New question",
        answer_outline: "",
        category,
        difficulty: 2,
      }),
    onSuccess: (res) => {
      syncQuestions(res.kit.questions);
      const created = res.kit.questions.at(-1);
      if (created) setEditingId(created.id);
      setError(null);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Could not add question"),
  });

  const regenMutation = useMutation({
    mutationFn: () => api.regenerate(kitId, "questions", regenCategory),
    onSuccess: (res) => {
      syncQuestions(res.kit.questions);
      setEditingId(null);
      setError(null);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Regenerate failed"),
  });

  function handleDragEnd(event: DragEndEvent, category: QuestionCategory) {
    if (editingId) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const items = grouped.get(category) ?? [];
    const oldIndex = items.findIndex((q) => q.id === active.id);
    const newIndex = items.findIndex((q) => q.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    const other = localQuestions.filter((q) => q.category !== category);
    const next = [...other, ...reordered];
    syncQuestions(next);
    reorderMutation.mutate(next.map((q) => ({ id: q.id, category: q.category })));
  }

  return (
    <div className="space-y-6">
      <Alert variant="info">
        Edited and pinned questions survive category regeneration. Only generated, unpinned
        items are replaced. Use Edit → Save to persist changes.
      </Alert>
      {error ? <Alert>{error}</Alert> : null}

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-muted/20 p-4">
        <div className="flex flex-row items-center gap-2">
          <label htmlFor="regen-cat" className="text-xs font-medium">
            Regenerate category
          </label>
          <select
            id="regen-cat"
            value={regenCategory}
            disabled={regenMutation.isPending}
            onChange={(e) => setRegenCategory(e.target.value as QuestionCategory)}
            className="h-9 rounded-lg border border-border bg-card px-2 text-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            {questionCategories.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <RegenerateButton
          isPending={regenMutation.isPending}
          idleLabel="Regenerate"
          pendingLabel="Regenerating questions…"
          onClick={() => regenMutation.mutate()}
        />
      </div>

      {questionCategories.map((category) => {
        const items = grouped.get(category) ?? [];
        const isRegeneratingCategory =
          regenMutation.isPending && regenCategory === category;
        const replaceableCount = items.filter(isReplaceableOnRegen).length;
        const trailingSkeletonCount =
          isRegeneratingCategory && replaceableCount === 0 ? 2 : 0;

        return (
          <Card
            key={category}
            className={cn(
              isRegeneratingCategory && "border-accent/40 ring-1 ring-accent/20",
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-base">{CATEGORY_LABELS[category]}</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={addMutation.isPending || isRegeneratingCategory}
                onClick={() => addMutation.mutate(category)}
              >
                <Plus className="h-4 w-4" aria-hidden />
                Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {isRegeneratingCategory ? (
                <RegeneratingBanner
                  label={`Regenerating ${CATEGORY_LABELS[category].toLowerCase()} questions…`}
                />
              ) : null}

              {items.length === 0 && !isRegeneratingCategory ? (
                <p className="text-sm text-muted-foreground">No questions in this category.</p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => handleDragEnd(e, category)}
                >
                  <SortableContext
                    items={items.map((q) => q.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {items.map((q) =>
                        isRegeneratingCategory && isReplaceableOnRegen(q) ? (
                          <QuestionItemSkeleton key={q.id} />
                        ) : (
                          <QuestionItem
                            key={q.id}
                            question={q}
                            isEditing={editingId === q.id}
                            isSaving={
                              saveMutation.isPending && saveMutation.variables?.id === q.id
                            }
                            isDeleting={
                              deleteMutation.isPending && deleteMutation.variables === q.id
                            }
                            isPinning={
                              pinMutation.isPending && pinMutation.variables?.id === q.id
                            }
                            onStartEdit={() => setEditingId(q.id)}
                            onCancelEdit={() => setEditingId(null)}
                            onSave={(patch) => saveMutation.mutate({ id: q.id, patch })}
                            onTogglePin={() =>
                              pinMutation.mutate({ id: q.id, pinned: !q.pinned })
                            }
                            onDelete={() => {
                              if (confirm("Delete this question?")) {
                                deleteMutation.mutate(q.id);
                              }
                            }}
                          />
                        ),
                      )}

                      {Array.from({ length: trailingSkeletonCount }).map((_, i) => (
                        <QuestionItemSkeleton key={`regen-skeleton-${i}`} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
