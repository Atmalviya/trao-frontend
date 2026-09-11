/** Non-httpOnly marker so Next.js middleware can gate page routes cross-origin. */
export const AUTH_SESSION_COOKIE = "prepkit.auth";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function setAuthSessionMarker() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_SESSION_COOKIE}=1; path=/; max-age=${MAX_AGE_SECONDS}; samesite=lax`;
}

export function clearAuthSessionMarker() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

export function hasAuthSessionMarker(cookieHeader: string | undefined) {
  if (!cookieHeader) return false;
  return cookieHeader.split(";").some((part) => {
    const [name, value] = part.trim().split("=");
    return name === AUTH_SESSION_COOKIE && value === "1";
  });
}
