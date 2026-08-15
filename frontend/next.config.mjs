// This file is a plain Node ESM module — Next.js loads it directly,
// before any TypeScript compilation runs — so it cannot `import` from
// lib/security/headers.ts or lib/performance/*.ts (both real, unit-tested
// TypeScript modules). The `headers()` function below hand-mirrors
// lib/security/headers.ts's directives; keep the two in sync when
// changing either. See docs/frontend/SECURITY_FRONTEND.md.

const isAnalyzeEnabled = process.env.ANALYZE === "true";

/**
 * CSP source expressions match by path prefix when a path is present —
 * "http://localhost:8000/api/v1" (no trailing slash) matches ONLY that
 * exact path, not "/api/v1/wardrobe" etc., which silently blocks every
 * real API call in any browser that enforces CSP. Reduce to just the
 * origin, same as lib/security/headers.ts's `originOf()`.
 */
function apiConnectSrcOrigin() {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000").origin;
  } catch {
    return "http://localhost:8000";
  }
}

/**
 * The browser uploads directly to a pre-signed storage URL (see
 * features/shopper/hooks/use-upload.ts) — connect-src needs that origin
 * too, not just the API origin above, or the browser silently blocks the
 * PUT itself (same class of bug as apiConnectSrcOrigin's, just for a
 * different origin). NEXT_PUBLIC_S3_PUBLIC_ENDPOINT_URL is the precise
 * signal for this; NEXT_PUBLIC_S3_PUBLIC_BASE_URL is a fallback (see
 * config/env.ts for why they're separate vars). Empty string if neither
 * is configured — connect-src just won't get an extra source, matching
 * lib/security/csp.ts's behavior.
 */
function storageConnectSrcOrigin() {
  const url =
    process.env.NEXT_PUBLIC_S3_PUBLIC_ENDPOINT_URL || process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL;
  if (!url) return "";
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

/**
 * Trusted image hosts — see docs/frontend/SECURITY_FRONTEND.md "Trusted
 * image domains config". `**.amazonaws.com` covers the default S3
 * endpoint shape; if NEXT_PUBLIC_S3_PUBLIC_BASE_URL points somewhere else
 * (a custom domain, a different provider), add that specific host here
 * rather than widening this further.
 */
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      // Same storage origin as connect-src below — img-src governs <img>
      // loads (what ResolvedImage actually renders), connect-src governs
      // fetch/XHR/axios (what use-upload.ts PUTs to and
      // use-resolved-image-url.ts fetches from). Both need it; neither
      // covers the other. Falls back to a broad `https:` when unconfigured
      // — harmless locally since http://localhost:9000 wouldn't match that
      // anyway (scheme mismatch), matching lib/security/csp.ts.
      `img-src 'self' data: blob:${storageConnectSrcOrigin() ? ` ${storageConnectSrcOrigin()}` : " https:"}`,
      "font-src 'self'",
      `connect-src 'self' ${apiConnectSrcOrigin()}${storageConnectSrcOrigin() ? ` ${storageConnectSrcOrigin()}` : ""}${process.env.NODE_ENV !== "production" ? " ws: wss:" : ""}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output produces a minimal, self-contained server bundle
  // (only the files actually needed at runtime) — see frontend/Dockerfile's
  // `runner` stage and docs/DEPLOYMENT_FRONTEND.md.
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

/**
 * Bundle analyzer — opt-in via `ANALYZE=true npm run build` (see the
 * `analyze` script in package.json and docs/frontend/PERFORMANCE.md
 * "Bundle analyzer"). Not imported unconditionally: `@next/bundle-analyzer`
 * is a devDependency, and wrapping unconditionally would still work in
 * production builds (it no-ops when disabled) but there's no reason to pay
 * even the `require` cost outside an explicit analysis run.
 */
export default isAnalyzeEnabled
  ? (await import("@next/bundle-analyzer")).default({ enabled: true })(nextConfig)
  : nextConfig;
