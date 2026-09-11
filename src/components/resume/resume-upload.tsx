"use client";

import { Button } from "@/components/ui/button";
import type { ResumeFileMeta } from "@/lib/types";
import { FileText, Upload, X } from "lucide-react";
import { useRef } from "react";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(n < 10_240 ? 1 : 0)} KB`;
}

export function validateResumeFile(file: File): string | null {
  const name = file.name.toLowerCase();
  const ok =
    name.endsWith(".pdf") ||
    name.endsWith(".docx") ||
    name.endsWith(".txt") ||
    name.endsWith(".md");
  if (!ok) return "Use PDF, DOCX, TXT, or MD.";
  if (file.size > MAX_BYTES) return "Resume must be under 5 MB.";
  if (file.size === 0) return "The file is empty.";
  return null;
}

export function ResumeUpload({
  selectedFile,
  onFileSelect,
  existingMeta,
  disabled,
  inputId = "resume-file",
}: {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  existingMeta?: ResumeFileMeta | null;
  disabled?: boolean;
  inputId?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <div
        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-8 text-center"
      >
        <FileText className="mb-2 h-7 w-7 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">
          PDF, DOCX, TXT, or MD · max 5 MB
        </p>
        {existingMeta && !selectedFile ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Current: {existingMeta.originalName} ({formatBytes(existingMeta.sizeBytes)})
          </p>
        ) : null}
        {selectedFile ? (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="font-medium">{selectedFile.name}</span>
            <span className="text-muted-foreground">({formatBytes(selectedFile.size)})</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => {
                onFileSelect(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              aria-label="Remove resume file"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
        <input
          ref={fileRef}
          id={inputId}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          disabled={disabled}
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            onFileSelect(file);
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          disabled={disabled}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-4 w-4" aria-hidden />
          {selectedFile || existingMeta ? "Choose different file" : "Choose resume"}
        </Button>
      </div>
    </div>
  );
}
