"use client";

import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ShimmerText } from "@/components/ui/shimmer";
import { cn } from "@/lib/cn";
import type { JobStep, StepName, StepStatus } from "@/lib/types";
import { STEP_LABELS } from "@/lib/types";
import { Check, Loader2, Minus, Sparkles, X } from "lucide-react";
import { useMemo } from "react";

const STEP_DESCRIPTIONS: Record<StepName, string> = {
  extract_requirements: "Reading the posting and pulling must-haves vs nice-to-haves",
  crawl_company_site: "Finding hiring pages and company context from their site",
  search_public_discussion: "Looking for public interview process discussions",
  company_brief: "Summarising what the company does from fetched pages",
  generate_questions: "Drafting category-specific questions tied to requirements",
  generate_flashcards: "Turning key topics into quick-review cards",
  coverage_check: "Closing gaps between requirements and generated questions",
  allocate_schedule: "Spreading material across your available days",
  validate_kit: "Final structure check before your kit is ready",
  analyze_resume_fit: "Matching your resume against role requirements",
};

function stepWeight(status: StepStatus): number {
  if (status === "done" || status === "skipped") return 1;
  if (status === "running") return 0.45;
  if (status === "failed") return 1;
  return 0;
}

function TimelineNode({ status }: { status: StepStatus }) {
  if (status === "done") {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 ring-2 ring-emerald-500/50">
        <Check className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2.5} aria-hidden />
      </div>
    );
  }
  if (status === "running") {
    return (
      <div className="relative flex h-7 w-7 items-center justify-center">
        <span
          className="absolute inset-0 animate-ping rounded-full bg-accent/25"
          aria-hidden
        />
        <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 ring-2 ring-accent/60">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" aria-hidden />
        </div>
      </div>
    );
  }
  if (status === "failed") {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-destructive/15 ring-2 ring-destructive/40">
        <X className="h-3.5 w-3.5 text-destructive" aria-hidden />
      </div>
    );
  }
  if (status === "skipped") {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted ring-2 ring-border">
        <Minus className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      </div>
    );
  }
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted/50 ring-2 ring-border/80">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" aria-hidden />
    </div>
  );
}

function WorkflowStep({
  step,
  isLast,
  isActive,
}: {
  step: JobStep;
  isLast: boolean;
  isActive: boolean;
}) {
  const showDetail =
    step.status === "running" ||
    step.status === "done" ||
    step.status === "skipped" ||
    step.status === "failed";

  return (
    <li className="relative flex gap-4 pb-0">
      {!isLast ? (
        <div
          className={cn(
            "absolute left-[13px] top-8 bottom-0 w-px",
            step.status === "done" || step.status === "skipped"
              ? "bg-emerald-500/35"
              : "bg-border",
          )}
          aria-hidden
        />
      ) : null}

      <div className="relative z-10 shrink-0 pt-0.5">
        <TimelineNode status={step.status} />
      </div>

      <div
        className={cn(
          "min-w-0 flex-1 pb-6",
          isActive && "rounded-lg border border-accent/25 bg-accent/5 px-3 py-2 -mx-3 -mt-1 mb-4",
        )}
      >
        <p
          className={cn(
            "text-sm font-medium leading-snug",
            step.status === "pending" && "text-muted-foreground",
            isActive && "text-foreground",
          )}
        >
          {isActive ? (
            <ShimmerText active>{STEP_LABELS[step.name]}</ShimmerText>
          ) : (
            STEP_LABELS[step.name]
          )}
        </p>

        {showDetail ? (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {step.note || STEP_DESCRIPTIONS[step.name]}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-muted-foreground/60">
            {STEP_DESCRIPTIONS[step.name]}
          </p>
        )}
      </div>
    </li>
  );
}

export function GenerationProgress({
  steps,
  notes,
  error,
  companyUrl,
  days,
}: {
  steps: JobStep[];
  notes?: string[];
  error?: { code: string; message: string } | null;
  companyUrl?: string;
  days?: number;
}) {
  const stats = useMemo(() => {
    const total = steps.length;
    const completed = steps.filter(
      (s) => s.status === "done" || s.status === "skipped" || s.status === "failed",
    ).length;
    const progress = Math.round(
      (steps.reduce((sum, s) => sum + stepWeight(s.status), 0) / Math.max(total, 1)) * 100,
    );
    const activeIndex = steps.findIndex((s) => s.status === "running");
    const activeStep = activeIndex >= 0 ? steps[activeIndex] : null;
    const isRunning = activeStep !== null;
    return { total, completed, progress, activeStep, isRunning };
  }, [steps]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card className="overflow-hidden border-border/80">
        <CardHeader className="space-y-4 border-b border-border/60 bg-muted/20 pb-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Sparkles className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold tracking-tight">
                <ShimmerText active={stats.isRunning}>
                  {stats.isRunning ? "Researching & building" : "Generation complete"}
                </ShimmerText>
              </h2>
              <p className="mt-1 text-sm text-muted-foreground text-balance">
                {stats.activeStep
                  ? STEP_DESCRIPTIONS[stats.activeStep.name]
                  : "Your personalised interview kit is on the way"}
              </p>
              {companyUrl ? (
                <p className="mt-2 truncate text-xs text-muted-foreground/80">
                  {companyUrl}
                  {days ? ` · ${days} day${days === 1 ? "" : "s"} to prepare` : ""}
                </p>
              ) : null}
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold tabular-nums leading-none">
                {stats.progress}%
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                {stats.completed}/{stats.total} steps
              </p>
            </div>
          </div>

          <div
            className="h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={stats.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Generation progress"
          >
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 ease-out",
                stats.isRunning
                  ? "bg-gradient-to-r from-accent/70 via-accent to-accent/70 bg-[length:200%_100%] animate-shimmer-bar"
                  : "bg-emerald-500/80",
              )}
              style={{ width: `${stats.progress}%` }}
            />
          </div>
        </CardHeader>

        <CardContent className="pt-5">
          <Collapsible defaultOpen>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Execution plan
              </p>
              <CollapsibleTrigger>Toggle steps</CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <ol className="mt-1" aria-label="Generation pipeline">
                {steps.map((step, i) => (
                  <WorkflowStep
                    key={step.name}
                    step={step}
                    isLast={i === steps.length - 1}
                    isActive={step.status === "running"}
                  />
                ))}
              </ol>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {notes && notes.length > 0 ? (
        <Collapsible defaultOpen={false}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-4">
              <p className="text-sm font-medium">Research notes</p>
              <CollapsibleTrigger>Show details</CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent className="px-5 pb-5">
              <ul className="space-y-2 text-sm text-muted-foreground">
                {notes.map((note, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 leading-relaxed"
                  >
                    {note}
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ) : null}

      {error ? (
        <Alert title="Generation failed">{error.message}</Alert>
      ) : stats.isRunning ? (
        <p className="text-center text-xs text-muted-foreground">
          Steps update live — your builder unlocks when validation finishes
        </p>
      ) : null}
    </div>
  );
}
