"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { applyPracticeRating, computePracticeStats } from "@/lib/practice-stats";
import type { PracticeData } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Brain, ChevronLeft, ChevronRight, Eye, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
  const [sessionComplete, setSessionComplete] = useState(false);

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
    onMutate: async ({ cardId, confidence }) => {
      await queryClient.cancelQueries({ queryKey: ["practice", kitId] });
      const previous = queryClient.getQueryData<PracticeData>(["practice", kitId]);
      if (previous) {
        const { progress, stats } = applyPracticeRating(previous, cardId, confidence);
        queryClient.setQueryData<PracticeData>(["practice", kitId], {
          ...previous,
          progress,
          stats,
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["practice", kitId], context.previous);
      }
    },
    onSuccess: (result) => {
      if (result?.stats) {
        queryClient.setQueryData<PracticeData>(["practice", kitId], (current) => {
          if (!current) return current;
          return { ...current, stats: result.stats };
        });
      }
      setRevealed(false);
      setIndex((current) => {
        const total = queryClient.getQueryData<PracticeData>(["practice", kitId])?.cards.length ?? 0;
        if (current + 1 >= total) {
          setSessionComplete(true);
          return current;
        }
        return current + 1;
      });
    },
  });

  const startNewSession = async () => {
    setSessionComplete(false);
    setRevealed(false);
    setIndex(0);
    await queryClient.fetchQuery({
      queryKey: ["practice", kitId],
      queryFn: () => api.getPractice(kitId),
    });
  };

  const stats = useMemo(() => {
    if (!data?.cards.length) {
      return {
        total: 0,
        seen: 0,
        unseen: 0,
        byConfidence: { 1: 0, 2: 0, 3: 0, 4: 0 },
        averageConfidence: null,
      };
    }
    return computePracticeStats(data.cards, data.progress);
  }, [data]);

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

  const pctSeen = stats.total ? Math.round((stats.seen / stats.total) * 100) : 0;

  if (sessionComplete) {
    return (
      <div className="space-y-6">
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
              <p className="text-2xl font-bold">{stats.unseen}</p>
              <p className="text-xs text-muted-foreground">Unseen</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {stats.averageConfidence?.toFixed(1) ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">Avg confidence</p>
            </div>
          </CardContent>
        </Card>

        <EmptyState
          icon={Brain}
          title="Session complete"
          description="You went through every card in this session. Start again to focus on what you know least."
          action={
            <Button type="button" onClick={() => void startNewSession()}>
              <RotateCcw className="h-4 w-4" aria-hidden />
              Practice again
            </Button>
          }
        />
      </div>
    );
  }

  const card = data.cards[index];
  const progress = data.progress[card.id];

  return (
    <div className="space-y-6">
      <Alert variant="info">
        This session keeps a fixed order. Your next session will start with what you know least.
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
            <p className="text-2xl font-bold">{stats.unseen}</p>
            <p className="text-xs text-muted-foreground">Unseen</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {stats.averageConfidence?.toFixed(1) ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground">Avg confidence</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {CONFIDENCE.map((c) => (
              <Badge key={c.value} tone="muted">
                {c.label}: {stats.byConfidence[c.value as 1 | 2 | 3 | 4]}
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
