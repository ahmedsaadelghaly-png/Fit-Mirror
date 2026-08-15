import { useQuery } from "@tanstack/react-query";

import { fetchTryOnJob } from "@/api/shopper/tryon";
import type { TryOnJobStatus } from "@/types/domain";

const TERMINAL_STATUSES: TryOnJobStatus[] = ["completed", "failed"];

/**
 * Polls `GET /tryon/{job_id}` every 2s while the job is `pending`/
 * `processing`, stopping automatically once it reaches a terminal status
 * (`completed`/`failed`) — see backend docs/SEQUENCE_DIAGRAMS.md for the
 * job lifecycle this mirrors. The AI service pipeline is a placeholder
 * today (fast, synthetic completion), but polling is written generically
 * so it keeps working once a real, slower model replaces it.
 */
export function useTryOnJob(jobId: string | null) {
  return useQuery({
    queryKey: ["tryon", "job", jobId],
    queryFn: () => fetchTryOnJob(jobId as string),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && TERMINAL_STATUSES.includes(status) ? false : 2000;
    },
  });
}
