import { apiClient } from "@/api/client";
import type { TryOnJob } from "@/types/domain";
import type { TryOnCreateRequest, TryOnJobAccepted } from "@/types/shopper";

/** See backend docs/API_CONTRACTS.md "Virtual Try-On". No pagination/filter query params exist server-side — callers filter the full list client-side (see features/tryon/hooks/use-tryon-jobs.ts). */
export async function listTryOnJobs(): Promise<TryOnJob[]> {
  const { data } = await apiClient.get<TryOnJob[]>("/tryon");
  return data;
}

export async function fetchTryOnJob(jobId: string): Promise<TryOnJob> {
  const { data } = await apiClient.get<TryOnJob>(`/tryon/${jobId}`);
  return data;
}

/** `202 Accepted` — the job is created as `pending`; poll `fetchTryOnJob` for status transitions. */
export async function createTryOnJob(payload: TryOnCreateRequest): Promise<TryOnJobAccepted> {
  const { data } = await apiClient.post<TryOnJobAccepted>("/tryon", payload);
  return data;
}
