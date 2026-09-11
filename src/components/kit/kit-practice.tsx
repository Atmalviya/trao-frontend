"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Brain, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useEffect, useState } from "react";

const CONFIDENCE = [
  { value: 1, label: "No idea" },
  { value: 2, label: "Shaky" },
  { value: 3, label: "Mostly there" },
  { value: 4, label: "Solid" },
];

export function KitPractice({ kitId }: { kitId: string }) {
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["practice", kitId],
    queryFn: () => api.getPractice(kitId),
  });

  useEffect(() => {
    if (!data) return;
    setIndex((current) => Math.min(current, Math.max(0, data.cards.length - 1)));
  }, [data]);

  const recordMutation = useMutation({
    mutationFn: ({ cardId, confidence }: { cardId: string; confidence: number }) =>
      api.recordConfidence(kitId, cardId, confidence),
    onSuccess: async () => {
      await queryClient.fetchQuery({
        queryKey: ["practice", kitId],
        queryFn: () => api.getPractice(kitId),
      });
      setRevealed(false);
      setIndex(0);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert title="Could not load practice">
        {error instanceof Error ? error.message : "Something went wrong"}
      </Alert>
    );
  }

  if (!data || data.cards.length === 0) {
    return (
      <EmptyState
        icon={Brain}
        title="No flashcards to practice"
        description="Add flashcards in the Flashcards tab first."
      />
    );
  }

  const card = data.cards[index];
  const progress = data.progress[card.id];
  const pctSeen = data.stats.total
    ? Math.round((data.stats.seen / data.stats.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <Alert variant="info">
        Cards are ordered by what you know least — unseen first, then lowest confidence.
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coverage</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <div>
            <p className="text-2xl font-bold">{pctSeen}%</p>
            <p className="text-xs text-muted-foreground">Cards seen</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{data.stats.unseen}</p>
            <p className="text-xs text-muted-foreground">Unseen</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {data.stats.averageConfidence?.toFixed(1) ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground">Avg confidence</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {CONFIDENCE.map((c) => (
              <Badge key={c.value} tone="muted">
                {c.label}: {data.stats.byConfidence[c.value as 1 | 2 | 3 | 4]}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Card {index + 1} of {data.cards.length}
          </CardTitle>
          {progress ? (
            <Badge tone="default">Last: {progress.confidence}/4</Badge>
          ) : (
            <Badge tone="muted">Unseen</Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="min-h-[120px] rounded-xl border border-border bg-muted/20 p-5 text-lg">
            {card.front}
          </div>

          {!revealed ? (
            <Button type="button" onClick={() => setRevealed(true)} className="w-full">
              <Eye className="h-4 w-4" aria-hidden />
              Reveal answer
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flashcard-scroll max-h-[min(320px,45vh)] overflow-y-auto overscroll-contain rounded-xl border border-accent/30 bg-accent/10 p-5 text-sm whitespace-pre-wrap leading-relaxed">
                {card.back || "No answer on file"}
              </div>
              <p className="text-sm font-medium">How confident did you feel?</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {CONFIDENCE.map((c) => (
                  <Button
                    key={c.value}
                    type="button"
                    variant="outline"
                    disabled={recordMutation.isPending}
                    onClick={() =>
                      recordMutation.mutate({ cardId: card.id, confidence: c.value })
                    }
                  >
                    {c.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              disabled={index === 0}
              onClick={() => {
                setIndex((i) => i - 1);
                setRevealed(false);
              }}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Previous
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={index >= data.cards.length - 1}
              onClick={() => {
                setIndex((i) => i + 1);
                setRevealed(false);
              }}
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
