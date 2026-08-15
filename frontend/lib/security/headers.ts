import { env } from "@/config/env";
import { buildContentSecurityPolicy } from "@/lib/security/csp";

/**
 * Security headers applied to every response — see
 * docs/frontend/SECURITY_FRONTEND.md "Security headers config". Same
 * cross-module-system caveat as csp.ts: `next.config.mjs` hand-mirrors
 * this list rather than importing it (it's a plain Node ESM file, loaded
 * before TypeScript compilation).
 */
export function getStaticSecurityHeaders(): { key: string; value: string }[] {
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
    },
  ];
}

function originOf(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}

/** Derives the CSP for the current environment from validated env config — see config/env.ts. */
export function getContentSecurityPolicy(): string {
  // NEXT_PUBLIC_S3_PUBLIC_ENDPOINT_URL is the precise "what origin does the
  // browser need to reach" signal (set whenever direct upload/download URLs
  // are browser-reachable); NEXT_PUBLIC_S3_PUBLIC_BASE_URL is kept as a
  // fallback so a deployment that only set the older var still gets a
  // scoped connect-src instead of none.
  const storageUrl = env.NEXT_PUBLIC_S3_PUBLIC_ENDPOINT_URL ?? env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL;
  return buildContentSecurityPolicy({
    apiOrigin: originOf(env.NEXT_PUBLIC_API_BASE_URL),
    storageOrigin: storageUrl ? originOf(storageUrl) : null,
    isDevelopment: env.NEXT_PUBLIC_APP_ENV === "development",
  });
}

export function getAllSecurityHeaders(): { key: string; value: string }[] {
  return [
    ...getStaticSecurityHeaders(),
    { key: "Content-Security-Policy", value: getContentSecurityPolicy() },
  ];
}
