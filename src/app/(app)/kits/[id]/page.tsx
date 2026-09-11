"use client";

import { GenerationProgress } from "@/components/generation-progress";
import { KitFlashcards } from "@/components/kit/kit-flashcards";
import { KitOverview } from "@/components/kit/kit-overview";
import { KitPractice } from "@/components/kit/kit-practice";
import { KitQuestions } from "@/components/kit/kit-questions";
import { KitSchedule } from "@/components/kit/kit-schedule";
import { KitTabs, type KitTab } from "@/components/kit/kit-tabs";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api, subscribeKitEvents } from "@/lib/api";
import type { KitDetail } from "@/lib/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function KitDetailPage() {
  const params = useParams<{ id: string }>();
  const kitId = params.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<KitTab>("overview");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["kit", kitId],
    queryFn: () => api.getKit(kitId),
    refetchInterval: (query) => {
      const d = query.state.data as KitDetail | undefined;
      return d?.status === "generating" ? 5000 : false;
    },
  });

  useEffect(() => {
    if (!data || data.status !== "generating") return;

    const unsub = subscribeKitEvents(
      kitId,
      (payload) => {
        queryClient.setQueryData(["kit", kitId], (old: KitDetail | undefined) => {
          if (!old) return old;
          return {
            ...old,
            job: old.job
              ? {
                  ...old.job,
                  status: payload.status,
                  steps: payload.steps,
                  error: payload.error,
                }
              : null,
          };
        });
        if (payload.status === "done" || payload.status === "failed") {
          void refetch();
        }
      },
    );

    return unsub;
  }, [data?.status, kitId, queryClient, refetch]);

  async function handleDelete() {
    if (!confirm("Delete this kit? This cannot be undone.")) return;
    await api.deleteKit(kitId);
    router.push("/dashboard");
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert title="Kit not found">
        {error instanceof Error ? error.message : "Could not load this kit"}
      </Alert>
    );
  }

  const title =
    data.kit?.role.title || data.kit?.source.company || data.input.companyUrl;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <Badge tone={data.status === "ready" ? "success" : data.status === "generating" ? "warning" : "muted"}>
              {data.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.input.days} days · {data.input.companyUrl}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void handleDelete()}>
          <Trash2 className="h-4 w-4" aria-hidden />
          Delete
        </Button>
      </div>

      {data.status === "generating" && data.job ? (
        <GenerationProgress
          steps={data.job.steps}
          notes={data.notes}
          error={data.job.error}
          companyUrl={data.input.companyUrl}
          days={data.input.days}
        />
      ) : null}

      {data.status === "failed" ? (
        <Alert title="Generation failed">
          {data.job?.error?.message || "This kit could not be generated."}
        </Alert>
      ) : null}

      {data.status === "ready" && data.kit ? (
        <>
          <KitTabs active={tab} onChange={setTab} />
          <div role="tabpanel">
            {tab === "overview" ? <KitOverview kitId={kitId} kit={data.kit} /> : null}
            {tab === "questions" ? <KitQuestions kitId={kitId} kit={data.kit} /> : null}
            {tab === "flashcards" ? <KitFlashcards kitId={kitId} kit={data.kit} /> : null}
            {tab === "schedule" ? <KitSchedule kitId={kitId} kit={data.kit} /> : null}
            {tab === "practice" ? <KitPractice kitId={kitId} /> : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
