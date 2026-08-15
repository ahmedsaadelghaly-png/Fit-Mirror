import { MOCK_TRYON_JOBS } from "@/api/admin/mock-data";
import { delay } from "@/api/admin/shared";
import type { AdminTryOnJobRow, TryOnJobRetryOverlay } from "@/types/admin";

/**
 * PLACEHOLDER — no platform-wide try-on job listing endpoint exists (only
 * `GET /tryon`, scoped to the caller's own jobs — see
 * docs/frontend/ADMIN_APP.md). "Retry failed job" has no backend endpoint
 * for an admin to resubmit another user's job either — captured as a
 * localStorage overlay that only records the retry request, since there's
 * nothing to actually resubmit against.
 */
export async function listAllTryOnJobs(): Promise<AdminTryOnJobRow[]> {
  await delay();
  return MOCK_TRYON_JOBS;
}

function storageKey(jobId: string): string {
  return `fitmirror.admin.tryon-retry.${jobId}`;
}

export function readRetryOverlaySync(jobId: string): TryOnJobRetryOverlay | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(jobId));
    return raw ? (JSON.parse(raw) as TryOnJobRetryOverlay) : null;
  } catch {
    return null;
  }
}

export async function requestJobRetry(jobId: string): Promise<TryOnJobRetryOverlay> {
  await delay();
  const overlay: TryOnJobRetryOverlay = { jobId, retryRequestedAt: new Date().toISOString() };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(storageKey(jobId), JSON.stringify(overlay));
  }
  return overlay;
}
