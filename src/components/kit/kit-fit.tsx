"use client";

import { ResumeUpload, validateResumeFile } from "@/components/resume/resume-upload";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api";
import type {
  Kit,
  RequirementFitStatus,
  ResumeFit,
  ResumeFitQualifies,
  ResumeFileMeta,
  ResumeFitStatus,
} from "@/lib/types";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

function qualifiesTone(q: ResumeFitQualifies): "success" | "warning" | "danger" | "muted" {
  if (q === "likely") return "success";
  if (q === "partial") return "warning";
  if (q === "unlikely") return "danger";
  return "muted";
}

function qualifiesLabel(q: ResumeFitQualifies): string {
  const labels: Record<ResumeFitQualifies, string> = {
    likely: "Strong fit",
    partial: "Partial fit",
    unlikely: "Gaps to address",
    insufficient_data: "Need more detail",
  };
  return labels[q];
}

function statusTone(s: RequirementFitStatus): "success" | "warning" | "danger" | "muted" {
  if (s === "met") return "success";
  if (s === "partial") return "warning";
  if (s === "gap") return "danger";
  return "muted";
}

function RequirementRow({
  text,
  priority,
  status,
  evidence,
  prepNote,
}: {
  text: string;
  priority: string;
  status: RequirementFitStatus;
  evidence: string;
  prepNote: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/50 p-4 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-medium">{text}</p>
        <div className="flex gap-2">
          <Badge tone={priority === "must" ? "accent" : "muted"}>{priority}</Badge>
          <Badge tone={statusTone(status)}>{status}</Badge>
        </div>
      </div>
      {evidence ? (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground/80">Evidence: </span>
          {evidence}
        </p>
      ) : null}
      {prepNote ? (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground/80">Prep: </span>
          {prepNote}
        </p>
      ) : null}
    </div>
  );
}

function FitReport({ fit, kit }: { fit: ResumeFit; kit: Kit }) {
  const reqById = new Map(kit.role.requirements.map((r) => [r.id, r.text]));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-lg">Fit summary</CardTitle>
            <Badge tone={qualifiesTone(fit.overall.qualifies)}>
              {qualifiesLabel(fit.overall.qualifies)}
            </Badge>
          </div>
          <CardDescription>
            Must-haves supported: {fit.overall.mustMet} / {fit.overall.mustTotal}
            {fit.overall.mustGapCount > 0
              ? ` · ${fit.overall.mustGapCount} gap${fit.overall.mustGapCount === 1 ? "" : "s"}`
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{fit.overall.summary}</p>
        </CardContent>
      </Card>

      {fit.strengths.length > 0 ? (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Strengths</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {fit.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {fit.focusAreas.length > 0 ? (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Focus areas</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {fit.focusAreas.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {fit.risks.length > 0 ? (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Risks</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {fit.risks.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">By requirement</h3>
        <div className="space-y-3">
          {fit.requirements.map((row) => (
            <RequirementRow
              key={row.requirementId}
              text={reqById.get(row.requirementId) ?? row.requirementId}
              priority={row.priority}
              status={row.status}
              evidence={row.evidence}
              prepNote={row.prepNote}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export function KitFit({
  kitId,
  kit,
  resumeFileMeta,
  resumeFit,
  resumeFitStatus = "none",
  resumeFitError,
  onUpdated,
}: {
  kitId: string;
  kit: Kit;
  resumeFileMeta?: ResumeFileMeta | null;
  resumeFit?: ResumeFit | null;
  resumeFitStatus?: ResumeFitStatus;
  resumeFitError?: string | null;
  onUpdated: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const analyzing = resumeFitStatus === "analyzing" || resumeFitStatus === "pending";

  async function handleUpload() {
    if (!file) return;
    const validation = validateResumeFile(file);
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.uploadResume(kitId, file);
      setFile(null);
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleReanalyze() {
    setError(null);
    setLoading(true);
    try {
      await api.reanalyzeResume(kitId);
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Re-analyze failed");
    } finally {
      setLoading(false);
    }
  }

  if (analyzing) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Spinner className="h-8 w-8" />
        <p className="text-sm text-muted-foreground">
          Analyzing your resume for this role…
        </p>
      </div>
    );
  }

  if (!resumeFileMeta && !resumeFit) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your fit</CardTitle>
          <CardDescription>
            Upload your resume to see how you match this role&apos;s requirements — strengths,
            gaps, and what to emphasise in prep.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? <Alert>{error}</Alert> : null}
          <ResumeUpload selectedFile={file} onFileSelect={setFile} disabled={loading} />
          <Button
            type="button"
            disabled={!file || loading}
            onClick={() => void handleUpload()}
          >
            {loading ? "Uploading…" : "Upload and analyze"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <Alert>{error}</Alert> : null}
      {resumeFitError ? <Alert title="Analysis failed">{resumeFitError}</Alert> : null}

      <div className="flex flex-wrap gap-2">
        {resumeFileMeta ? (
          <p className="text-sm text-muted-foreground self-center">
            Resume: {resumeFileMeta.originalName}
          </p>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => void handleReanalyze()}
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Re-analyze
        </Button>
      </div>

      {resumeFit ? <FitReport fit={resumeFit} kit={kit} /> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Replace resume</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ResumeUpload
            selectedFile={file}
            onFileSelect={setFile}
            existingMeta={resumeFileMeta}
            disabled={loading}
            inputId="resume-replace"
          />
          <Button
            type="button"
            variant="outline"
            disabled={!file || loading}
            onClick={() => void handleUpload()}
          >
            {loading ? "Uploading…" : "Upload and re-analyze"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
