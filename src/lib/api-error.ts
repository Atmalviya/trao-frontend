import type { ApiError } from "./types";

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
  }
}

export function parseApiError(body: unknown, status: number): ApiRequestError {
  const err = body as ApiError | null;
  return new ApiRequestError(
    err?.error?.message || `Request failed (${status})`,
    status,
    err?.error?.code,
  );
}

let unauthorizedHandler: (() => void | Promise<void>) | null = null;
let handlingUnauthorized = false;

export function setUnauthorizedHandler(handler: (() => void | Promise<void>) | null) {
  unauthorizedHandler = handler;
}

const AUTH_PATHS_WITHOUT_GLOBAL_LOGOUT = [
  "/auth/login",
  "/auth/register",
  "/auth/me",
  "/auth/logout",
];

export async function notifyUnauthorized(path: string) {
  if (handlingUnauthorized) return;
  if (AUTH_PATHS_WITHOUT_GLOBAL_LOGOUT.some((prefix) => path.startsWith(prefix))) {
    return;
  }

  const handler = unauthorizedHandler;
  if (!handler) return;

  handlingUnauthorized = true;
  try {
    await handler();
  } finally {
    handlingUnauthorized = false;
  }
}
