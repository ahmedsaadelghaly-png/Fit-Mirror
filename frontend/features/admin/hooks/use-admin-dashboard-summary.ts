import { useQuery } from "@tanstack/react-query";

import { MOCK_ALERTS } from "@/api/admin/mock-data";
import { listAllProducts } from "@/api/admin/products";
import { fetchQueueStats, fetchWorkers } from "@/api/admin/queue";
import { listStores } from "@/api/admin/stores";
import { listAllTryOnJobs } from "@/api/admin/tryon-jobs";
import { listUsers } from "@/api/admin/users";
import { buildAdminDashboardSummary } from "@/features/admin/lib/dashboard-summary-adapter";

async function fetchAlerts() {
  return MOCK_ALERTS;
}

export function useAdminDashboardSummary() {
  const usersQuery = useQuery({ queryKey: ["admin", "users"], queryFn: listUsers });
  const storesQuery = useQuery({ queryKey: ["admin", "stores"], queryFn: listStores });
  const productsQuery = useQuery({ queryKey: ["admin", "products"], queryFn: listAllProducts });
  const tryOnJobsQuery = useQuery({ queryKey: ["admin", "tryon-jobs"], queryFn: listAllTryOnJobs });
  const queueQuery = useQuery({ queryKey: ["admin", "queue-stats"], queryFn: fetchQueueStats });
  const workersQuery = useQuery({ queryKey: ["admin", "workers"], queryFn: fetchWorkers });
  const alertsQuery = useQuery({ queryKey: ["admin", "alerts"], queryFn: fetchAlerts });

  const queries = [
    usersQuery,
    storesQuery,
    productsQuery,
    tryOnJobsQuery,
    queueQuery,
    workersQuery,
    alertsQuery,
  ];
  const isLoading = queries.some((query) => query.isLoading);
  const isError = queries.some((query) => query.isError);

  const summary =
    !isLoading && !isError
      ? buildAdminDashboardSummary({
          users: usersQuery.data ?? [],
          stores: storesQuery.data ?? [],
          products: productsQuery.data ?? [],
          tryOnJobs: tryOnJobsQuery.data ?? [],
          queueStats: queueQuery.data ?? [],
          workers: workersQuery.data ?? [],
          alerts: alertsQuery.data ?? [],
        })
      : null;

  return {
    isLoading,
    isError,
    summary,
    refetch: () => queries.forEach((query) => query.refetch()),
  };
}
