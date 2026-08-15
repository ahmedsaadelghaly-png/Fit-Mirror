import { addBreadcrumb, getBreadcrumbs } from "@/lib/monitoring/breadcrumbs";
import { logger } from "@/lib/monitoring/logger";
import { reportToSentry } from "@/lib/monitoring/sentry";

export { addBreadcrumb, getBreadcrumbs } from "@/lib/monitoring/breadcrumbs";
export { logger } from "@/lib/monitoring/logger";
export { startSpan, traced } from "@/lib/monitoring/tracing";

/**
 * The one function `components/error-boundary/error-boundary.tsx` and
 * `api/client.ts`-adjacent error paths should call to report an unhandled
 * error: logs it locally (always) and forwards it to Sentry (only if
 * configured — see lib/monitoring/sentry.ts). Also drops a breadcrumb so
 * the error itself shows up in the trail leading to the next one.
 */
export function captureError(error: unknown, context?: Record<string, unknown>): void {
  const message = error instanceof Error ? error.message : String(error);
  logger.error(message, {
    ...context,
    breadcrumbs: getBreadcrumbs(),
    stack: error instanceof Error ? error.stack : undefined,
  });
  addBreadcrumb("error", message, context);
  reportToSentry(error, context);
}
