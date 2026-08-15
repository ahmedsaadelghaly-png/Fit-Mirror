import { useQuery } from "@tanstack/react-query";

import { fetchSystemHealthChecks } from "@/api/admin/system-health";
import { buildSystemHealthSummary } from "@/features/admin/lib/system-health-adapter";
import { useAiServiceHealth } from "@/features/admin/hooks/use-ai-service-health";

export function useSystemHealth() {
  const checksQuery = useQuery({
    queryKey: ["admin", "system-health"],
    queryFn: fetchSystemHealthChecks,
    // The one real check in here (`GET /health`) is cheap and worth
    // re-verifying periodically rather than trusting a stale result.
    refetchInterval: 30_000,
  });
  const aiServiceQuery = useAiServiceHealth();

  const isLoading = checksQuery.isLoading || aiServiceQuery.isLoading;
  const isError = checksQuery.isError || aiServiceQuery.isError;

  const summary =
    checksQuery.data && aiServiceQuery.data
      ? buildSystemHealthSummary(checksQuery.data, aiServiceQuery.data)
      : null;

  return {
    isLoading,
    isError,
    summary,
    refetch: () => {
      checksQuery.refetch();
      aiServiceQuery.refetch();
    },
  };
}
