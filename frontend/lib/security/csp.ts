/**
 * Content-Security-Policy builder — see docs/frontend/SECURITY_FRONTEND.md
 * "CSP header strategy". This is the canonical, unit-tested source; the
 * header actually sent by the server is configured in `next.config.mjs`,
 * which is a plain Node ESM file executed before any TypeScript
 * compilation runs — it cannot `import` this `.ts` module directly, so its
 * `headers()` function hand-mirrors the same directives inline (commented
 * as such). Keep the two in sync when changing either.
 *
 * Deliberately allows `'unsafe-inline'` for `script-src`/`style-src`
 * rather than a nonce-based policy: Next.js's App Router injects inline
 * bootstrap scripts and Tailwind/Radix inject inline styles, and a
 * zero-`unsafe-inline` policy requires wiring a per-request nonce through
 * every layout via middleware — a bigger change than this pass's scope.
 * Documented as a follow-up in SECURITY_FRONTEND.md, not silently skipped.
 */
export interface CspOptions {
  apiOrigin: string;
  /** The configured public storage bucket origin, if any — see config/env.ts NEXT_PUBLIC_S3_PUBLIC_BASE_URL. */
  storageOrigin?: string | null;
  /** Relaxes connect-src for Next.js's dev-mode HMR websocket. */
  isDevelopment: boolean;
}

export function buildContentSecurityPolicy({
  apiOrigin,
  storageOrigin,
  isDevelopment,
}: CspOptions): string {
  const connectSrc = ["'self'", apiOrigin];
  // The browser uploads directly to a pre-signed storage URL (see
  // features/shopper/hooks/use-upload.ts) — that PUT needs connect-src
  // permission to the storage origin too, not just img-src (img-src only
  // covers <img>/background-image loads, not fetch/XHR/axios requests).
  if (storageOrigin) connectSrc.push(storageOrigin);
  if (isDevelopment) connectSrc.push("ws:", "wss:");

  const imgSrc = ["'self'", "data:", "blob:"];
  if (storageOrigin) imgSrc.push(storageOrigin);
  else imgSrc.push("https:"); // no bucket configured yet — see resolve-image-url.ts's own fallback behavior

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", ...(isDevelopment ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": imgSrc,
    "font-src": ["'self'"], // next/font self-hosts at build time — no external font host needed
    "connect-src": connectSrc,
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
  };

  return Object.entries(directives)
    .map(([directive, sources]) => `${directive} ${sources.join(" ")}`)
    .join("; ");
}
