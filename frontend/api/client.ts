import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import { env } from "@/config/env";
import { clearTokens, getAccessToken, getRefreshToken, setAccessToken } from "@/lib/auth-token";
import { captureError } from "@/lib/monitoring";
import type { ApiErrorBody } from "@/types/api";

/**
 * Normalized error shape every API call throws/rejects with, regardless of
 * whether the backend returned its structured `{error_code, message}` body
 * (see backend docs/ERROR_CODES.md), FastAPI's default validation error
 * shape, or the request never reached the server at all.
 */
export class ApiError extends Error {
  readonly status: number | null;
  readonly errorCode: string;

  constructor(message: string, status: number | null, errorCode: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errorCode = errorCode;
  }
}

/**
 * Pure function converting a failed Axios response into an `ApiError` —
 * extracted from the interceptor so it's unit-testable without spinning
 * up a server or mocking the whole Axios instance (see
 * tests/unit/api/normalize-error.test.ts).
 */
export function normalizeError(error: AxiosError<ApiErrorBody | { detail: unknown }>): ApiError {
  if (!error.response) {
    return new ApiError(
      "Could not reach the server. Check your connection and try again.",
      null,
      "network_error",
    );
  }

  const { status, data } = error.response;

  // Backend's structured error envelope (see backend docs/ERROR_CODES.md).
  if (data && typeof data === "object" && "error_code" in data) {
    return new ApiError(data.message, status, data.error_code);
  }

  // FastAPI's default validation error shape (`{"detail": [...]}`) —
  // see backend docs/RESPONSE_STANDARDS.md §4 on the planned unification.
  if (data && typeof data === "object" && "detail" in data) {
    const detail = data.detail;
    const message = Array.isArray(detail) ? "Please check the form for errors." : String(detail);
    return new ApiError(message, status, "validation_error");
  }

  return new ApiError("Something went wrong. Please try again.", status, "internal_error");
}

export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

/** Request interceptor: attaches the bearer token when present (see lib/auth-token.ts). */
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

/**
 * Endpoints that must never trigger a refresh-and-retry — refreshing on a
 * failed login/register/refresh call would either be meaningless (no
 * session exists yet) or risk an infinite loop (the refresh call itself
 * failing with 401).
 */
const AUTH_ENDPOINTS_EXCLUDED_FROM_REFRESH = ["/auth/login", "/auth/register", "/auth/refresh"];

/**
 * De-duplicates concurrent refresh attempts: if five requests all 401 at
 * once, only one `/auth/refresh` call is made and all five retry with its
 * result, rather than racing five separate refresh calls.
 */
let inFlightRefresh: Promise<string> | null = null;

async function performRefresh(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available.");
  }

  // A plain axios call, not `apiClient` — avoids re-entering these same
  // interceptors (and the circular import that would result from calling
  // through features/auth/api.ts, which itself imports `apiClient`).
  const response = await axios.post<{ access_token: string }>(
    `${env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`,
    { refresh_token: refreshToken },
  );

  setAccessToken(response.data.access_token);
  return response.data.access_token;
}

/**
 * Reports only genuinely unexpected failures (5xx, or no response at all)
 * to monitoring — see docs/frontend/OBSERVABILITY.md "API error tracking".
 * Deliberately NOT called for 4xx (validation errors, bad credentials,
 * not-found, ...): those are expected, user-facing outcomes the calling
 * form/page already surfaces via `ApiError.message`, not bugs to alert on.
 */
function reportUnexpectedApiError(normalized: ApiError, requestUrl?: string): ApiError {
  if (normalized.status === null || normalized.status >= 500) {
    captureError(normalized, {
      url: requestUrl,
      errorCode: normalized.errorCode,
      status: normalized.status,
    });
  }
  return normalized;
}

/**
 * Response interceptor:
 *   1. On a 401 from anything other than the auth endpoints themselves,
 *      attempt exactly one silent token refresh and retry the original
 *      request with the new token.
 *   2. If the refresh fails (no refresh token, or the refresh token is
 *      itself expired/invalid), clear the session and send the user to
 *      `/session-expired` — see app/(auth)/session-expired/page.tsx.
 *   3. Every other failure is normalized via `normalizeError` above, and
 *      reported to monitoring if it's a genuinely unexpected one.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody | { detail: unknown }>) => {
    const originalRequest = error.config as
      (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    const isRefreshable =
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !AUTH_ENDPOINTS_EXCLUDED_FROM_REFRESH.some((path) => originalRequest.url?.includes(path));

    if (isRefreshable && originalRequest) {
      originalRequest._retry = true;
      try {
        inFlightRefresh ??= performRefresh().finally(() => {
          inFlightRefresh = null;
        });
        const newAccessToken = await inFlightRefresh;
        originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
        return apiClient(originalRequest);
      } catch {
        clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/session-expired";
        }
        return Promise.reject(reportUnexpectedApiError(normalizeError(error), originalRequest.url));
      }
    }

    return Promise.reject(reportUnexpectedApiError(normalizeError(error), originalRequest?.url));
  },
);
