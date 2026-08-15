import type {
  AdminAlert,
  AdminProductRow,
  AdminStoreRow,
  AdminTryOnJobRow,
  AdminUserRow,
  QueueStats,
  WorkerStatusRow,
} from "@/types/admin";

export interface AdminDashboardSummary {
  userCount: number;
  activeUserCount: number;
  storeCount: number;
  verifiedStoreCount: number;
  productCount: number;
  activeProductCount: number;
  tryOnJobCount: number;
  tryOnJobsByStatus: Record<string, number>;
  queuePendingTotal: number;
  queueProcessingTotal: number;
  queueFailedTotal: number;
  workersOnline: number;
  workersTotal: number;
  alerts: AdminAlert[];
}

/**
 * Pure adapter composing the (mostly mocked — see
 * docs/frontend/ADMIN_APP.md) data sources the Admin dashboard needs into
 * one view model. Kept side-effect-free and exported standalone so it's
 * unit-testable without mocking TanStack Query, mirroring
 * features/brand/lib/dashboard-summary-adapter.ts from Phase 2.4.
 */
export function buildAdminDashboardSummary(input: {
  users: AdminUserRow[];
  stores: AdminStoreRow[];
  products: AdminProductRow[];
  tryOnJobs: AdminTryOnJobRow[];
  queueStats: QueueStats[];
  workers: WorkerStatusRow[];
  alerts: AdminAlert[];
}): AdminDashboardSummary {
  const { users, stores, products, tryOnJobs, queueStats, workers, alerts } = input;

  const tryOnJobsByStatus = tryOnJobs.reduce<Record<string, number>>((acc, job) => {
    acc[job.status] = (acc[job.status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    userCount: users.length,
    activeUserCount: users.filter((user) => user.is_active).length,
    storeCount: stores.length,
    verifiedStoreCount: stores.filter((store) => store.is_verified).length,
    productCount: products.length,
    activeProductCount: products.filter((product) => product.is_active).length,
    tryOnJobCount: tryOnJobs.length,
    tryOnJobsByStatus,
    queuePendingTotal: queueStats.reduce((sum, queue) => sum + queue.pending, 0),
    queueProcessingTotal: queueStats.reduce((sum, queue) => sum + queue.processing, 0),
    queueFailedTotal: queueStats.reduce((sum, queue) => sum + queue.failed, 0),
    workersOnline: workers.filter((worker) => worker.state === "online").length,
    workersTotal: workers.length,
    alerts,
  };
}
