import { MOCK_AI_SERVICE_HEALTH } from "@/api/admin/mock-data";
import { delay } from "@/api/admin/shared";
import type { AiServiceHealth } from "@/types/admin";

/**
 * PLACEHOLDER — the AI service's real `GET /api/v1/health` is reachable
 * only inside the Docker network (never exposed publicly, and the main
 * backend proxies nothing to it — see docs/frontend/ADMIN_APP.md). Model
 * registry, GPU status, and inference latency have no backend source at
 * all — the AI service itself is a placeholder pipeline with a single
 * hardcoded model today.
 */
export async function fetchAiServiceHealth(): Promise<AiServiceHealth> {
  await delay();
  return MOCK_AI_SERVICE_HEALTH;
}
