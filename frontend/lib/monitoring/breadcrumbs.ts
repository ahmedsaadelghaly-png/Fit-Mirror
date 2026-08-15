/**
 * User-action breadcrumb trail — PLACEHOLDER. Real error-tracking vendors
 * (Sentry, Bugsnag) attach the last N breadcrumbs to every captured
 * error/exception automatically; this is a vendor-agnostic in-memory
 * substitute for that, so `captureError()` (see lib/monitoring/index.ts)
 * has something to attach even before a real vendor is wired in. See
 * docs/frontend/OBSERVABILITY.md.
 */
export interface Breadcrumb {
  category: string;
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

const MAX_BREADCRUMBS = 20;
let breadcrumbs: Breadcrumb[] = [];

export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>,
): void {
  breadcrumbs.push({ category, message, data, timestamp: new Date().toISOString() });
  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs = breadcrumbs.slice(-MAX_BREADCRUMBS);
  }
}

export function getBreadcrumbs(): readonly Breadcrumb[] {
  return breadcrumbs;
}

export function clearBreadcrumbs(): void {
  breadcrumbs = [];
}
