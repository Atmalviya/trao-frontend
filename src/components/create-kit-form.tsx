"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ResumeUpload, validateResumeFile } from "@/components/resume/resume-upload";
import { api } from "@/lib/api";
import { parseBatchFile } from "@/lib/batch-parse";
import { Upload, FileJson } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";

type Mode = "single" | "batch";

export function CreateKitForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("single");
  const [jd, setJd] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [days, setDays] = useState(7);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (resumeFile) {
      const validation = validateResumeFile(resumeFile);
      if (validation) {
        setError(validation);
        return;
      }
    }
    setLoading(true);
    try {
      let res;
      if (resumeFile) {
        const formData = new FormData();
        formData.append("jd", jd);
        formData.append("companyUrl", companyUrl);
        formData.append("days", String(days));
        formData.append("resume", resumeFile);
        res = await api.createKitWithResume(formData);
      } else {
        res = await api.createKit({ jd, companyUrl, days });
      }
      router.push(`/kits/${res.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create kit");
    } finally {
      setLoading(false);
    }
  }

  async function onBatchFile(file: File) {
    setError(null);
    setLoading(true);
    try {
      const text = await file.text();
      const cases = parseBatchFile(text);
      const res = await api.createBatch(cases);
      const first = res.kits[0];
      if (res.kits.length === 1) {
        router.push(`/kits/${first.id}`);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse batch file");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 rounded-lg border border-border bg-muted/40 p-1">
        <button
          type="button"
          onClick={() => setMode("single")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
            mode === "single"
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Single role
        </button>
        <button
          type="button"
          onClick={() => setMode("batch")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
            mode === "batch"
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Multiple roles
        </button>
      </div>

      {mode === "single" ? (
        <Card>
          <CardHeader>
            <CardTitle>Create a prep kit</CardTitle>
            <CardDescription>
              Paste the job description and company website. We research and build your kit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              {error ? <Alert>{error}</Alert> : null}
              <div className="space-y-2">
                <label htmlFor="jd" className="text-sm font-medium">
                  Job description
                </label>
                <Textarea
                  id="jd"
                  required
                  placeholder="Paste the full job posting here…"
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  rows={10}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="companyUrl" className="text-sm font-medium">
                    Company website
                  </label>
                  <Input
                    id="companyUrl"
                    type="url"
                    required
                    placeholder="https://company.com"
                    value={companyUrl}
                    onChange={(e) => setCompanyUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="days" className="text-sm font-medium">
                    Days until interview
                  </label>
                  <Input
                    id="days"
                    type="number"
                    min={1}
                    max={60}
                    required
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Resume (optional)</label>
                <p className="text-xs text-muted-foreground">
                  Upload to see how you match this role after the kit is ready.
                </p>
                <ResumeUpload
                  selectedFile={resumeFile}
                  onFileSelect={setResumeFile}
                  disabled={loading}
                  inputId="create-resume"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? "Starting…" : "Generate kit"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Prepare for multiple roles</CardTitle>
            <CardDescription>
              Upload a JSON file with an array of cases. Each needs{" "}
              <code className="rounded bg-muted px-1">jd</code>,{" "}
              <code className="rounded bg-muted px-1">company_url</code> (or companyUrl), and{" "}
              <code className="rounded bg-muted px-1">days</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? <Alert>{error}</Alert> : null}
            <div
              className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center"
            >
              <FileJson className="mb-3 h-8 w-8 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">
                JSON array, up to 20 roles
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                className="sr-only"
                id="batch-file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onBatchFile(file);
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                disabled={loading}
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-4 w-4" aria-hidden />
                {loading ? "Uploading…" : "Choose JSON file"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
