import { logger } from "@/lib/monitoring/logger";

/**
 * Performance tracing — PLACEHOLDER. Real APM vendors (Sentry
 * Performance, Datadog RUM) wrap a unit of work in a "span" that reports
 * duration/tags to a backend automatically. This measures real durations
 * via the browser's own `performance.now()` (not mocked), but only logs
 * them locally today — swap the body of `finishSpan` for a real vendor
 * call once one is wired in (see lib/monitoring/sentry.ts for the same
 * pattern). See docs/frontend/OBSERVABILITY.md.
 */
export interface Span {
  name: string;
  finish: (extra?: Record<string, unknown>) => void;
}

export function startSpan(name: string): Span {
  const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();

  return {
    name,
    finish: (extra) => {
      const endedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
      const durationMs = Math.round(endedAt - startedAt);
      logger.debug(`span: ${name}`, { durationMs, ...extra });
    },
  };
}

/** Convenience wrapper for tracing a single async operation. */
export async function traced<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const span = startSpan(name);
  try {
    return await fn();
  } finally {
    span.finish();
  }
}
