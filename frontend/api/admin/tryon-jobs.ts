import { apiClient } from "@/api/client";
import type { AdminTryOnJobRow } from "@/types/admin";

/** Real `GET /admin/tryon-jobs`, newest first — see docs/API_CONTRACTS.md "Platform Admin". */
export async function listAllTryOnJobs(): Promise<AdminTryOnJobRow[]> {
  const { data } = await apiClient.get<AdminTryOnJobRow[]>("/admin/tryon-jobs", {
    params: { limit: 200 },
  });
  return data;
}

/**
 * Re-queues a failed job with its original inputs; it goes back to
 * `pending` and the worker picks it up. The backend rejects (422) any job
 * that isn't `failed`.
 */
export async function retryTryOnJob(jobId: string): Promise<AdminTryOnJobRow> {
  const { data } = await apiClient.post<AdminTryOnJobRow>(`/admin/tryon-jobs/${jobId}/retry`);
  return data;
}
