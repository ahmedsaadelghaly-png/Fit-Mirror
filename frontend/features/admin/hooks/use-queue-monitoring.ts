import { useQuery } from "@tanstack/react-query";

import { fetchQueueStats, fetchWorkers } from "@/api/admin/queue";

export function useQueueMonitoring() {
  const queueQuery = useQuery({ queryKey: ["admin", "queue-stats"], queryFn: fetchQueueStats });
  const workersQuery = useQuery({ queryKey: ["admin", "workers"], queryFn: fetchWorkers });

  return {
    isLoading: queueQuery.isLoading || workersQuery.isLoading,
    isError: queueQuery.isError || workersQuery.isError,
    refetch: () => {
      queueQuery.refetch();
      workersQuery.refetch();
    },
    queueStats: queueQuery.data ?? [],
    workers: workersQuery.data ?? [],
  };
}
