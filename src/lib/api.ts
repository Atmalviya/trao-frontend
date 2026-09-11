import {
  ApiRequestError,
  notifyUnauthorized,
  parseApiError,
} from "./api-error";
import type {
  CreateKitInput,
  JobEventPayload,
  Kit,
  KitDetail,
  KitSummary,
  PracticeData,
  PracticeStats,
  UserPublic,
} from "./types";

export { ApiRequestError } from "./api-error";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:4000";

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401) {
      await notifyUnauthorized(path);
    }
    throw parseApiError(body, res.status);
  }

  return body as T;
}

export const api = {
  me: () => request<{ user: UserPublic }>("/auth/me"),

  register: (email: string, password: string) =>
    request<{ user: UserPublic }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    request<{ user: UserPublic }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () => request<void>("/auth/logout", { method: "POST" }),

  listKits: () => request<{ kits: KitSummary[] }>("/kits"),

  getKit: (id: string) => request<KitDetail>(`/kits/${id}`),

  createKit: (input: CreateKitInput) =>
    request<{ id: string; status: string; deduped: boolean }>("/kits", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  createBatch: (cases: CreateKitInput[]) =>
    request<{ kits: { id: string; status: string; deduped: boolean; companyUrl: string }[] }>(
      "/kits/batch",
      { method: "POST", body: JSON.stringify({ cases }) },
    ),

  deleteKit: (id: string) =>
    request<void>(`/kits/${id}`, { method: "DELETE" }),

  updateQuestion: (
    kitId: string,
    qid: string,
    patch: Partial<{
      prompt: string;
      answer_outline: string;
      category: string;
      difficulty: number;
      requirement_ids: string[];
      pinned: boolean;
    }>,
  ) =>
    request<{ kit: Kit }>(`/kits/${kitId}/questions/${qid}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  addQuestion: (
    kitId: string,
    data: {
      prompt: string;
      answer_outline?: string;
      category: string;
      difficulty: number;
      requirement_ids?: string[];
    },
  ) =>
    request<{ kit: Kit }>(`/kits/${kitId}/questions`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteQuestion: (kitId: string, qid: string) =>
    request<{ kit: Kit }>(`/kits/${kitId}/questions/${qid}`, { method: "DELETE" }),

  reorderQuestions: (
    kitId: string,
    items: { id: string; category: string }[],
  ) =>
    request<{ kit: Kit }>(`/kits/${kitId}/questions/reorder`, {
      method: "PUT",
      body: JSON.stringify({ items }),
    }),

  updateFlashcard: (
    kitId: string,
    fid: string,
    patch: Partial<{
      front: string;
      back: string;
      requirement_ids: string[];
      pinned: boolean;
    }>,
  ) =>
    request<{ kit: Kit }>(`/kits/${kitId}/flashcards/${fid}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  addFlashcard: (
    kitId: string,
    data: { front: string; back?: string; requirement_ids?: string[] },
  ) =>
    request<{ kit: Kit }>(`/kits/${kitId}/flashcards`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteFlashcard: (kitId: string, fid: string) =>
    request<{ kit: Kit }>(`/kits/${kitId}/flashcards/${fid}`, { method: "DELETE" }),

  updateBrief: (
    kitId: string,
    patch: { summary?: string; what_they_do?: string },
  ) =>
    request<{ kit: Kit }>(`/kits/${kitId}/brief`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  regenerate: (
    kitId: string,
    section: "schedule" | "company_brief" | "questions",
    category?: string,
  ) =>
    request<{ kit: Kit }>(`/kits/${kitId}/regenerate`, {
      method: "POST",
      body: JSON.stringify({ section, category }),
    }),

  getPractice: (kitId: string) =>
    request<PracticeData>(`/kits/${kitId}/practice`),

  recordConfidence: (kitId: string, cardId: string, confidence: number) =>
    request<{ stats: PracticeStats }>(`/kits/${kitId}/practice/${cardId}`, {
      method: "POST",
      body: JSON.stringify({ confidence }),
    }),
};

export function subscribeKitEvents(
  kitId: string,
  onUpdate: (payload: JobEventPayload) => void,
  onError?: (err: Event) => void,
): () => void {
  const es = new EventSource(`${API_URL}/kits/${kitId}/events`, {
    withCredentials: true,
  });

  es.onmessage = (e) => {
    try {
      onUpdate(JSON.parse(e.data) as JobEventPayload);
    } catch {
      /* ignore malformed */
    }
  };

  es.onerror = (e) => onError?.(e);

  return () => es.close();
}
