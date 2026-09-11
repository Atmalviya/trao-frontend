"use client";

import { RegeneratingBanner } from "@/components/kit/regenerating-banner";
import { ScheduleDaySkeleton } from "@/components/kit/schedule-day-skeleton";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegenerateButton } from "@/components/ui/regenerate-button";
import { api } from "@/lib/api";
import { syncKitFromQuestionMutation } from "@/lib/sync-kit-cache";
import type { Kit, Question } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

export function KitSchedule({ kitId, kit }: { kitId: string; kit: Kit }) {
  const queryClient = useQueryClient();
  const [schedule, setSchedule] = useState(kit.schedule);
  const [questions, setQuestions] = useState(kit.questions);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSchedule(kit.schedule);
    setQuestions(kit.questions);
  }, [kit.schedule, kit.questions]);

  const questionMap = useMemo(
    () => new Map(questions.map((q) => [q.id, q] as const)),
    [questions],
  );

  const syncSchedule = useCallback(
    (nextKit: Pick<Kit, "schedule" | "questions" | "coverage">) => {
      setSchedule(nextKit.schedule);
      setQuestions(nextKit.questions);
      syncKitFromQuestionMutation(queryClient, kitId, nextKit);
    },
    [kitId, queryClient],
  );

  const regenMutation = useMutation({
    mutationFn: () => api.regenerate(kitId, "schedule"),
    onSuccess: (res) => {
      syncSchedule(res.kit);
      setError(null);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Regenerate failed"),
  });

  const skeletonCount = Math.max(schedule.days.length, schedule.days_available, 2);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {schedule.days_available} days · must-haves distributed early
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
      ) : schedule.days.length === 0 ? (
        <Alert title="No schedule yet">
          Add questions to this kit, then regenerate the schedule to build your study plan.
        </Alert>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {schedule.days.map((day) => (
            <ScheduleDayCard key={day.day} day={day} questionMap={questionMap} />
          ))}
        </div>
      )}
    </div>
  );
}

function ScheduleDayCard({
  day,
  questionMap,
}: {
  day: Kit["schedule"]["days"][number];
  questionMap: Map<string, Question>;
}) {
  return (
    <Card>
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
        {day.question_ids.length === 0 ? (
          <p className="text-sm text-muted-foreground">Review and consolidation</p>
        ) : (
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
        )}
      </CardContent>
    </Card>
  );
}
