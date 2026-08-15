/**
 * Minimal client-side cookie helper.
 *
 * Why cookies instead of localStorage (Phase 2.1 used an in-memory
 * variable, which didn't survive a refresh and was invisible to
 * middleware): Next.js middleware runs at the edge, before any client JS
 * executes, and can only read cookies — not localStorage. Storing the
 * access token in a cookie is what makes real route protection in
 * middleware.ts possible.
 *
 * Security note (documented in detail in docs/frontend/AUTHENTICATION.md):
 * these are plain, client-readable cookies, NOT httpOnly. A true httpOnly
 * cookie can only be set by the server on the response — the backend's
 * `/auth/login` returns tokens in the JSON body today (see backend
 * docs/API_CONTRACTS.md), not a `Set-Cookie` header, and changing that is
 * a backend change out of scope for this frontend phase ("do not change
 * backend APIs unless unavoidable"). This is a deliberate, documented
 * trade-off: client-set cookies are readable by any script on the page
 * (same XSS exposure as localStorage), but they at least make
 * middleware-level route gating possible, which localStorage cannot.
 */

export interface CookieOptions {
  maxAgeSeconds?: number;
  path?: string;
  sameSite?: "lax" | "strict" | "none";
}

export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === "undefined") return;

  const { maxAgeSeconds, path = "/", sameSite = "lax" } = options;
  let cookie = `${name}=${encodeURIComponent(value)}; path=${path}; samesite=${sameSite}`;
  if (maxAgeSeconds !== undefined) {
    cookie += `; max-age=${maxAgeSeconds}`;
  }
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    cookie += "; secure";
  }
  document.cookie = cookie;
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  const value = match?.[1];
  return value !== undefined ? decodeURIComponent(value) : null;
}

export function deleteCookie(name: string, path = "/"): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=${path}; max-age=0`;
}
