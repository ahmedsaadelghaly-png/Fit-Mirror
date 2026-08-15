/**
 * Sentry integration — CONFIGURABLE PLACEHOLDER, not wired to a real
 * vendor. Per the Phase 2.6 rules ("mark vendor integrations as
 * configurable placeholders"), `@sentry/nextjs` is NOT an installed
 * dependency here — importing it unconditionally would break the build
 * for anyone who hasn't installed/configured it. This module is what
 * `lib/monitoring/index.ts::captureError` calls; it no-ops unless
 * `NEXT_PUBLIC_SENTRY_DSN` is set, in which case it still no-ops today but
 * logs a reminder that the real SDK isn't wired in yet.
 *
 * To make this real:
 *   1. `npm install @sentry/nextjs`
 *   2. Run `npx @sentry/wizard@latest -i nextjs` (generates
 *      sentry.client.config.ts / sentry.server.config.ts / sentry.edge.config.ts)
 *   3. Replace the body of `reportToSentry` below with a real
 *      `Sentry.captureException(error, { extra: context })` call.
 *   4. Add `NEXT_PUBLIC_SENTRY_DSN` to config/env.ts's schema and your
 *      deployment environment.
 */
import { env } from "@/config/env";
import { logger } from "@/lib/monitoring/logger";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

export function isSentryConfigured(): boolean {
  return !!SENTRY_DSN;
}

export function reportToSentry(error: unknown, context?: Record<string, unknown>): void {
  if (!isSentryConfigured()) return;

  // PLACEHOLDER: replace with `Sentry.captureException(error, { extra: context })`.
  logger.warn("NEXT_PUBLIC_SENTRY_DSN is set, but @sentry/nextjs is not installed/wired yet.", {
    appEnv: env.NEXT_PUBLIC_APP_ENV,
    error: error instanceof Error ? error.message : String(error),
    context,
  });
}
