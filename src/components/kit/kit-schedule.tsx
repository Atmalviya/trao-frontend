"use client";

import { RegeneratingBanner } from "@/components/kit/regenerating-banner";
import { ScheduleDaySkeleton } from "@/components/kit/schedule-day-skeleton";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegenerateButton } from "@/components/ui/regenerate-button";
import { api } from "@/lib/api";
import type { Kit } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
import { useState } from "react";

export function KitSchedule({ kitId, kit }: { kitId: string; kit: Kit }) {
  const queryClient = useQueryClient();
  const questionMap = new Map(kit.questions.map((q) => [q.id, q]));
  const [error, setError] = useState<string | null>(null);

  const regenMutation = useMutation({
    mutationFn: () => api.regenerate(kitId, "schedule"),
    onSuccess: (res) => {
      queryClient.setQueryData(["kit", kitId], (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        return { ...old, kit: res.kit };
      });
      setError(null);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Regenerate failed"),
  });

  const skeletonCount = Math.max(kit.schedule.days.length, kit.schedule.days_available, 2);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {kit.schedule.days_available} days · must-haves distributed early
        </p>
        <RegenerateButton
          size="sm"
          isPending={regenMutation.isPending}
          idleLabel="Regenerate schedule"
          pendingLabel="Regenerating schedule…"
          onClick={() => regenMutation.mutate()}
        />
      </div>

      {error ? <Alert>{error}</Alert> : null}
      {regenMutation.isPending ? (
        <RegeneratingBanner label="Regenerating study schedule…" />
      ) : null}

      {regenMutation.isPending ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <ScheduleDaySkeleton key={i} />
          ))}
        </div>
      ) : (
      <div className="grid gap-4 md:grid-cols-2">
        {kit.schedule.days.map((day) => (
          <Card key={day.day}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-accent" aria-hidden />
                Day {day.day}
                <Badge tone="muted" className="ml-auto">
                  {day.minutes} min
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">{day.focus}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {day.question_ids.map((qid) => {
                  const q = questionMap.get(qid);
                  return (
                    <li
                      key={qid}
                      className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm"
                    >
                      {q ? (
                        <>
                          <Badge tone="muted" className="mb-1">
                            {q.category}
                          </Badge>
                          <p>{q.prompt}</p>
                        </>
                      ) : (
                        <span className="text-muted-foreground">{qid}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
      )}
    </div>
  );
}
