import { fetchBackendHealth } from "@/api/admin/health";
import { delay } from "@/api/admin/shared";
import type { SystemHealthCheck } from "@/types/admin";

/**
 * The backend check is real (`GET /health`, see api/admin/health.ts).
 * Database, Redis, and storage have no health-check endpoint exposed to
 * the frontend at all (Postgres/Redis/MinIO healthchecks only run inside
 * Docker Compose, checked by the orchestrator, never over an HTTP path
 * this app can call) — see docs/frontend/ADMIN_APP.md. Those three are
 * mocked as healthy so the page has realistic content instead of three
 * permanently-unknown rows.
 */
export async function fetchSystemHealthChecks(): Promise<SystemHealthCheck[]> {
  const [backend] = await Promise.all([fetchBackendHealth(), delay(200)]);

  const mocked: SystemHealthCheck[] = [
    { service: "PostgreSQL", status: "healthy", detail: "Accepting connections", isMocked: true },
    { service: "Redis", status: "healthy", detail: "PONG", isMocked: true },
    {
      service: "Object storage (S3/MinIO)",
      status: "healthy",
      detail: "Bucket reachable",
      isMocked: true,
    },
  ];

  return [backend, ...mocked];
}
