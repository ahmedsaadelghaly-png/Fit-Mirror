import { env } from "@/config/env";
import { logger } from "@/lib/monitoring/logger";

/**
 * Production-safety checks beyond `config/env.ts`'s structural Zod
 * validation (which only checks *shape* — a valid URL, a known enum
 * value — not whether that value makes sense *in production*). Call once
 * at startup (see providers/app-providers.tsx). Every check here logs a
 * warning rather than throwing: a misconfigured-but-technically-valid env
 * shouldn't crash the app, but it should be loud in logs/monitoring. See
 * docs/frontend/SECURITY_FRONTEND.md "Production env safety checks".
 */
export function validateProductionEnv(): void {
  if (env.NEXT_PUBLIC_APP_ENV !== "production") return;

  const warnings: string[] = [];

  if (/localhost|127\.0\.0\.1/.test(env.NEXT_PUBLIC_API_BASE_URL)) {
    warnings.push(
      "NEXT_PUBLIC_API_BASE_URL points at localhost while NEXT_PUBLIC_APP_ENV=production.",
    );
  }

  if (env.NEXT_PUBLIC_API_BASE_URL.startsWith("http://")) {
    warnings.push("NEXT_PUBLIC_API_BASE_URL uses http:// (not https://) in production.");
  }

  if (env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL?.startsWith("http://")) {
    warnings.push("NEXT_PUBLIC_S3_PUBLIC_BASE_URL uses http:// (not https://) in production.");
  }

  for (const warning of warnings) {
    logger.warn(`Production env safety check failed: ${warning}`);
  }
}
