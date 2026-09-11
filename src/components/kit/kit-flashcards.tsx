"use client";

import { FlashcardItem } from "@/components/kit/flashcard-item";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import type { Flashcard, Kit } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Layers, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function KitFlashcards({ kitId, kit }: { kitId: string; kit: Kit }) {
  const queryClient = useQueryClient();
  const [cards, setCards] = useState(kit.flashcards);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCards(kit.flashcards);
  }, [kit.flashcards]);

  const syncKit = useCallback(
    (nextCards: Flashcard[]) => {
      setCards(nextCards);
      queryClient.setQueryData(["kit", kitId], (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        const prev = old as { kit: Kit };
        return { ...prev, kit: { ...prev.kit, flashcards: nextCards } };
      });
    },
    [kitId, queryClient],
  );

  const addMutation = useMutation({
    mutationFn: () => api.addFlashcard(kitId, { front: "New prompt", back: "" }),
    onSuccess: (res) => {
      syncKit(res.kit.flashcards);
      const created = res.kit.flashcards.at(-1);
      if (created) setEditingId(created.id);
      setError(null);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Could not add card"),
  });

  const saveMutation = useMutation({
    mutationFn: ({
      id,
      front,
      back,
    }: {
      id: string;
      front: string;
      back: string;
    }) => api.updateFlashcard(kitId, id, { front, back }),
    onSuccess: (res, vars) => {
      syncKit(res.kit.flashcards);
      setEditingId(null);
      setError(null);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Could not save"),
  });

  const pinMutation = useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) =>
      api.updateFlashcard(kitId, id, { pinned }),
    onSuccess: (res) => {
      syncKit(res.kit.flashcards);
      setError(null);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Could not update pin"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteFlashcard(kitId, id),
    onSuccess: (res, id) => {
      syncKit(res.kit.flashcards);
      if (editingId === id) setEditingId(null);
      setError(null);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Could not delete"),
  });

  const pinnedCount = cards.filter((c) => c.pinned).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Flashcard deck</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {cards.length} card{cards.length === 1 ? "" : "s"}
            {pinnedCount > 0 ? ` · ${pinnedCount} pinned` : ""}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={addMutation.isPending}
          onClick={() => addMutation.mutate()}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add flashcard
        </Button>
      </div>

      {error ? <Alert>{error}</Alert> : null}

      {cards.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No flashcards yet"
          description="Add cards to review key concepts, or generate them when building a kit."
          action={
            <Button type="button" onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>
              <Plus className="h-4 w-4" aria-hidden />
              Add your first card
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card, index) => (
            <FlashcardItem
              key={card.id}
              card={card}
              index={index}
              isEditing={editingId === card.id}
              isSaving={saveMutation.isPending && saveMutation.variables?.id === card.id}
              isDeleting={deleteMutation.isPending && deleteMutation.variables === card.id}
              isPinning={pinMutation.isPending && pinMutation.variables?.id === card.id}
              onStartEdit={() => setEditingId(card.id)}
              onCancelEdit={() => setEditingId(null)}
              onSave={(patch) => saveMutation.mutate({ id: card.id, ...patch })}
              onTogglePin={() =>
                pinMutation.mutate({ id: card.id, pinned: !card.pinned })
              }
              onDelete={() => {
                if (confirm("Delete this flashcard?")) deleteMutation.mutate(card.id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
