import axios from "axios";

import { env } from "@/config/env";
import type { SystemHealthCheck } from "@/types/admin";

/**
 * The ONE real, callable endpoint this entire admin surface has —
 * `GET /health` (see backend/app/main.py). It's registered at the
 * backend's root, NOT under `/api/v1` (unlike every other endpoint this
 * app calls), and returns an ad-hoc `{status, service}` dict rather than a
 * typed Pydantic response. A plain `axios` call, not `apiClient`: it's
 * unauthenticated and outside `/api/v1`, so `apiClient`'s baseURL and
 * bearer-token interceptor don't apply.
 */
const BACKEND_ROOT_URL = env.NEXT_PUBLIC_API_BASE_URL.replace(/\/api\/v1\/?$/, "");

interface BackendHealthResponse {
  status: string;
  service: string;
}

export async function fetchBackendHealth(): Promise<SystemHealthCheck> {
  try {
    const { data } = await axios.get<BackendHealthResponse>(`${BACKEND_ROOT_URL}/health`, {
      timeout: 5000,
    });
    return {
      service: data.service,
      status: data.status === "ok" ? "healthy" : "degraded",
      detail: `Responded with status "${data.status}"`,
      isMocked: false,
    };
  } catch {
    return {
      service: "FitMirror AI Backend",
      status: "down",
      detail: "The backend did not respond to GET /health",
      isMocked: false,
    };
  }
}
