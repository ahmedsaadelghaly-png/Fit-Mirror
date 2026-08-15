import { describe, expect, it } from "vitest";

import { buildAdminDashboardSummary } from "@/features/admin/lib/dashboard-summary-adapter";
import type {
  AdminProductRow,
  AdminStoreRow,
  AdminTryOnJobRow,
  AdminUserRow,
  QueueStats,
  WorkerStatusRow,
} from "@/types/admin";

function user(overrides: Partial<AdminUserRow>): AdminUserRow {
  return {
    id: crypto.randomUUID(),
    email: "user@example.com",
    full_name: null,
    role: "shopper",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    last_login_at: null,
    ...overrides,
  };
}

function store(overrides: Partial<AdminStoreRow>): AdminStoreRow {
  return {
    id: crypto.randomUUID(),
    name: "Store",
    slug: "store",
    owner_email: "owner@example.com",
    is_verified: true,
    is_suspended: false,
    product_count: 0,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function product(overrides: Partial<AdminProductRow>): AdminProductRow {
  return {
    id: crypto.randomUUID(),
    title: "Product",
    store_name: "Store",
    category: "tops",
    price: "10.00",
    currency: "USD",
    is_active: true,
    primary_image_key: null,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function tryOnJob(overrides: Partial<AdminTryOnJobRow>): AdminTryOnJobRow {
  return {
    id: crypto.randomUUID(),
    status: "completed",
    user_email: "user@example.com",
    store_name: "Store",
    user_image_key: "a",
    garment_image_key: "b",
    result_image_key: "c",
    ai_model_name: "model",
    error_message: null,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

const emptyQueueAndWorkers = {
  queueStats: [] as QueueStats[],
  workers: [] as WorkerStatusRow[],
  alerts: [],
};

describe("buildAdminDashboardSummary", () => {
  it("counts total and active users separately", () => {
    const result = buildAdminDashboardSummary({
      users: [user({ is_active: true }), user({ is_active: false })],
      stores: [],
      products: [],
      tryOnJobs: [],
      ...emptyQueueAndWorkers,
    });

    expect(result.userCount).toBe(2);
    expect(result.activeUserCount).toBe(1);
  });

  it("counts total and verified stores separately", () => {
    const result = buildAdminDashboardSummary({
      users: [],
      stores: [store({ is_verified: true }), store({ is_verified: false })],
      products: [],
      tryOnJobs: [],
      ...emptyQueueAndWorkers,
    });

    expect(result.storeCount).toBe(2);
    expect(result.verifiedStoreCount).toBe(1);
  });

  it("groups try-on jobs by status", () => {
    const result = buildAdminDashboardSummary({
      users: [],
      stores: [],
      products: [],
      tryOnJobs: [
        tryOnJob({ status: "completed" }),
        tryOnJob({ status: "failed" }),
        tryOnJob({ status: "failed" }),
      ],
      ...emptyQueueAndWorkers,
    });

    expect(result.tryOnJobCount).toBe(3);
    expect(result.tryOnJobsByStatus.completed).toBe(1);
    expect(result.tryOnJobsByStatus.failed).toBe(2);
  });

  it("sums queue stats across queues", () => {
    const result = buildAdminDashboardSummary({
      users: [],
      stores: [],
      products: [product({})],
      tryOnJobs: [],
      queueStats: [
        { queueName: "tryon", pending: 2, processing: 1, failed: 3, throughputPerMinute: 5 },
        { queueName: "other", pending: 1, processing: 0, failed: 1, throughputPerMinute: 2 },
      ],
      workers: [],
      alerts: [],
    });

    expect(result.queuePendingTotal).toBe(3);
    expect(result.queueProcessingTotal).toBe(1);
    expect(result.queueFailedTotal).toBe(4);
  });

  it("counts only online workers as online", () => {
    const result = buildAdminDashboardSummary({
      users: [],
      stores: [],
      products: [],
      tryOnJobs: [],
      queueStats: [],
      workers: [
        {
          id: "w1",
          hostname: "a",
          state: "online",
          activeTasks: 1,
          concurrency: 4,
          lastHeartbeatAt: "2026-01-01T00:00:00Z",
        },
        {
          id: "w2",
          hostname: "b",
          state: "degraded",
          activeTasks: 0,
          concurrency: 4,
          lastHeartbeatAt: "2026-01-01T00:00:00Z",
        },
      ],
      alerts: [],
    });

    expect(result.workersTotal).toBe(2);
    expect(result.workersOnline).toBe(1);
  });
});
