import { ApiError } from "@/api/client";

/**
 * Centralized TanStack Query cache-tuning policy — see
 * docs/frontend/PERFORMANCE.md "Cache tuning". Before this, every
 * feature's `useQuery` either inherited the provider's single global
 * `staleTime` (30s) or set its own ad hoc value inline; this gives every
 * new hook a named tier to pick from instead of a magic number, and
 * documents *why* each tier exists.
 */
export const STALE_TIME = {
  /** Data that changes almost never within a session (e.g. the current user, a store's identity). */
  LONG: 5 * 60 * 1000,
  /** The default for most list/detail views — matches the provider's original global default. */
  STANDARD: 30 * 1000,
  /** Data that should feel close to live (queue/worker status, active try-on job polling). */
  SHORT: 5 * 1000,
  /** Never cache — always refetch (used sparingly; prefer a real `refetchInterval` instead where polling is the actual intent). */
  NONE: 0,
} as const;

/**
 * Shared retry policy: don't retry a request that failed for a reason
 * retrying won't fix (4xx client errors — bad input, not found, 401/403),
 * but do retry transient 5xx/network failures a couple of times. Extracted
 * from providers/query-provider.tsx so every `useQuery` in the app (not
 * just ones registered before this refactor) gets the same policy, and so
 * it's unit-testable without instantiating a QueryClient.
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status !== null && error.status < 500) {
    return false;
  }
  return failureCount < 2;
}

export const MAX_QUERY_RETRIES = 2;
