import { MOCK_QUEUE_STATS, MOCK_WORKERS } from "@/api/admin/mock-data";
import { delay } from "@/api/admin/shared";
import type { QueueStats, WorkerStatusRow } from "@/types/admin";

/**
 * PLACEHOLDER — no Celery/queue monitoring endpoint exists anywhere in the
 * backend (confirmed: `backend/app/workers/` has no monitoring code, no
 * Flower service in docker-compose). The only real signal is the Celery
 * worker's own Docker healthcheck (`celery inspect ping`), which isn't
 * reachable over HTTP — see docs/frontend/ADMIN_APP.md.
 */
export async function fetchQueueStats(): Promise<QueueStats[]> {
  await delay();
  return MOCK_QUEUE_STATS;
}

export async function fetchWorkers(): Promise<WorkerStatusRow[]> {
  await delay();
  return MOCK_WORKERS;
}
