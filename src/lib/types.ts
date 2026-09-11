export const requirementKinds = ["technical", "behavioural", "domain"] as const;
export const requirementPriorities = ["must", "nice"] as const;
export const questionCategories = [
  "technical",
  "behavioural",
  "system-design",
  "company-fit",
] as const;
export const itemOrigins = ["generated", "edited", "manual"] as const;

export type RequirementKind = (typeof requirementKinds)[number];
export type RequirementPriority = (typeof requirementPriorities)[number];
export type QuestionCategory = (typeof questionCategories)[number];
export type ItemOrigin = (typeof itemOrigins)[number];
export type KitStatus = "generating" | "ready" | "failed";
export type JobStatus = "running" | "done" | "failed";
export type StepStatus = "pending" | "running" | "done" | "skipped" | "failed";

export const stepNames = [
  "extract_requirements",
  "crawl_company_site",
  "search_public_discussion",
  "company_brief",
  "generate_questions",
  "generate_flashcards",
  "coverage_check",
  "allocate_schedule",
  "validate_kit",
  "analyze_resume_fit",
] as const;

export type StepName = (typeof stepNames)[number];

export interface Requirement {
  id: string;
  text: string;
  kind: RequirementKind;
  priority: RequirementPriority;
}

export interface Question {
  id: string;
  requirement_ids: string[];
  category: QuestionCategory;
  prompt: string;
  answer_outline: string;
  difficulty: number;
  origin: ItemOrigin;
  pinned: boolean;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  requirement_ids: string[];
  origin: ItemOrigin;
  pinned: boolean;
}

export interface ScheduleDay {
  day: number;
  focus: string;
  question_ids: string[];
  minutes: number;
}

export interface Kit {
  source: {
    company: string;
    company_url: string;
    role: string;
    location: string;
    jd_chars: number;
    researched_at: string;
    pages_used: string[];
  };
  company_brief: {
    summary: string;
    what_they_do: string;
    sources: string[];
  };
  role: {
    title: string;
    seniority: string;
    responsibilities: string[];
    requirements: Requirement[];
  };
  questions: Question[];
  flashcards: Flashcard[];
  schedule: {
    days_available: number;
    days: ScheduleDay[];
  };
  coverage: {
    uncovered_requirement_ids: string[];
    passes: number;
  };
}

export interface JobStep {
  name: StepName;
  status: StepStatus;
  note?: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface KitSummary {
  id: string;
  status: KitStatus;
  role: string | null;
  company: string | null;
  companyUrl: string;
  days: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeFileMeta {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  extractionMethod: "plain" | "docx" | "pdf";
  charCount: number;
  warnings: string[];
}

export type ResumeFitQualifies = "likely" | "partial" | "unlikely" | "insufficient_data";
export type RequirementFitStatus = "met" | "partial" | "gap" | "unclear";
export type ResumeFitStatus = "none" | "pending" | "analyzing" | "ready" | "failed";

export interface ResumeFit {
  analyzedAt: string;
  resumeChars: number;
  overall: {
    mustMet: number;
    mustTotal: number;
    mustGapCount: number;
    qualifies: ResumeFitQualifies;
    summary: string;
  };
  requirements: Array<{
    requirementId: string;
    priority: RequirementPriority;
    status: RequirementFitStatus;
    evidence: string;
    prepNote: string;
  }>;
  strengths: string[];
  focusAreas: string[];
  risks: string[];
}

export interface KitDetail {
  id: string;
  status: KitStatus;
  input: { jd: string; companyUrl: string; days: number };
  kit: Kit | null;
  notes: string[];
  resumeFileMeta?: ResumeFileMeta | null;
  resumeFit?: ResumeFit | null;
  resumeFitStatus?: ResumeFitStatus;
  resumeFitError?: string | null;
  job: {
    id: string;
    status: JobStatus;
    steps: JobStep[];
    error: { code: string; message: string } | null;
  } | null;
}

export interface UserPublic {
  id: string;
  email: string;
}

export interface PracticeStats {
  total: number;
  seen: number;
  unseen: number;
  byConfidence: { 1: number; 2: number; 3: number; 4: number };
  averageConfidence: number | null;
}

export interface CardProgress {
  cardId: string;
  confidence: number;
  timesSeen: number;
  lastSeenAt: string;
}

export interface PracticeData {
  cards: Flashcard[];
  stats: PracticeStats;
  progress: Record<string, CardProgress>;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: { path: string; message: string }[];
  };
}

export interface CreateKitInput {
  jd: string;
  companyUrl: string;
  days: number;
}

export interface JobEventPayload {
  status: JobStatus;
  steps: JobStep[];
  error: { code: string; message: string } | null;
}

export const STEP_LABELS: Record<StepName, string> = {
  extract_requirements: "Extract requirements",
  crawl_company_site: "Crawl company site",
  search_public_discussion: "Search public discussion",
  company_brief: "Write company brief",
  generate_questions: "Generate questions",
  generate_flashcards: "Generate flashcards",
  coverage_check: "Coverage check",
  allocate_schedule: "Allocate schedule",
  validate_kit: "Validate kit",
  analyze_resume_fit: "Analyze resume fit",
};
