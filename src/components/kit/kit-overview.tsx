"use client";

import { BriefFieldsSkeleton } from "@/components/kit/brief-fields-skeleton";
import { RegeneratingBanner } from "@/components/kit/regenerating-banner";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegenerateButton } from "@/components/ui/regenerate-button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { debounce } from "@/lib/debounce";
import { cn } from "@/lib/cn";
import type { Kit } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

export function KitOverview({ kitId, kit }: { kitId: string; kit: Kit }) {
  const queryClient = useQueryClient();
  const [summary, setSummary] = useState(kit.company_brief.summary);
  const [whatTheyDo, setWhatTheyDo] = useState(kit.company_brief.what_they_do);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setSummary(kit.company_brief.summary);
    setWhatTheyDo(kit.company_brief.what_they_do);
  }, [kit.company_brief.summary, kit.company_brief.what_they_do]);

  const saveMutation = useMutation({
    mutationFn: (patch: { summary?: string; what_they_do?: string }) =>
      api.updateBrief(kitId, patch),
    onSuccess: (res) => {
      queryClient.setQueryData(["kit", kitId], (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        return { ...old, kit: res.kit };
      });
      setSaveError(null);
    },
    onError: (err) => setSaveError(err instanceof Error ? err.message : "Save failed"),
  });

  const debouncedSave = useMemo(
    () =>
      debounce((s: string, w: string) => {
        saveMutation.mutate({ summary: s, what_they_do: w });
      }, 600),
    [saveMutation],
  );

  const onSummaryChange = useCallback(
    (value: string) => {
      setSummary(value);
      debouncedSave(value, whatTheyDo);
    },
    [debouncedSave, whatTheyDo],
  );

  const onWhatChange = useCallback(
    (value: string) => {
      setWhatTheyDo(value);
      debouncedSave(summary, value);
    },
    [debouncedSave, summary],
  );

  const regenMutation = useMutation({
    mutationFn: () => api.regenerate(kitId, "company_brief"),
    onSuccess: (res) => {
      setSummary(res.kit.company_brief.summary);
      setWhatTheyDo(res.kit.company_brief.what_they_do);
      queryClient.setQueryData(["kit", kitId], (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        return { ...old, kit: res.kit };
      });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{kit.role.title || "Role"}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {kit.source.company} · {kit.role.seniority} · {kit.source.location}
            </p>
          </div>
          <Badge tone="default">{kit.schedule.days_available} days</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium">Responsibilities</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {kit.role.responsibilities.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium">Requirements</h3>
            <ul className="mt-2 space-y-2">
              {kit.role.requirements.map((req) => (
                <li
                  key={req.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm"
                >
                  <Badge tone={req.priority === "must" ? "accent" : "muted"}>
                    {req.priority}
                  </Badge>
                  <Badge tone="muted">{req.kind}</Badge>
                  <span>{req.text}</span>
                </li>
              ))}
            </ul>
          </div>
          {kit.coverage.uncovered_requirement_ids.length > 0 ? (
            <Alert variant="warning" title="Coverage gaps">
              Requirements without questions:{" "}
              {kit.coverage.uncovered_requirement_ids.join(", ")} ({kit.coverage.passes}{" "}
              passes)
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <Card
        className={cn(
          regenMutation.isPending && "border-accent/40 ring-1 ring-accent/20",
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">Company brief</CardTitle>
          <RegenerateButton
            size="sm"
            isPending={regenMutation.isPending}
            idleLabel="Regenerate brief"
            pendingLabel="Regenerating brief…"
            onClick={() => regenMutation.mutate()}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {saveError ? <Alert>{saveError}</Alert> : null}
          {regenMutation.isPending ? (
            <>
              <RegeneratingBanner label="Regenerating company brief…" />
              <BriefFieldsSkeleton />
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label htmlFor="brief-summary" className="text-sm font-medium">
                  Summary
                </label>
                <Textarea
                  id="brief-summary"
                  value={summary}
                  onChange={(e) => onSummaryChange(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="brief-what" className="text-sm font-medium">
                  What they do
                </label>
                <Textarea
                  id="brief-what"
                  value={whatTheyDo}
                  onChange={(e) => onWhatChange(e.target.value)}
                  rows={4}
                />
              </div>
            </>
          )}
          {kit.company_brief.sources.length > 0 ? (
            <div className={cn(regenMutation.isPending && "opacity-50")}>
              <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Sources
              </h4>
              <ul className="mt-2 space-y-1 text-xs">
                {kit.company_brief.sources.map((url) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-accent hover:underline"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
