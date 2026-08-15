import { apiClient } from "@/api/client";
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  RefreshRequest,
  RegisterRequest,
  RegisterResponse,
  TokenResponse,
} from "@/types/auth";
import type { User } from "@/types/domain";

/**
 * Thin, typed wrappers around the backend's auth endpoints — see backend
 * docs/API_CONTRACTS.md "Auth". Kept feature-local (not in the generic
 * `api/` client folder) since the request/response shapes here are
 * specific to the auth feature, not shared platform-wide concerns.
 */
export async function login(payload: LoginRequest): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>("/auth/login", payload);
  return data;
}

export async function register(payload: RegisterRequest): Promise<RegisterResponse> {
  const { data } = await apiClient.post<RegisterResponse>("/auth/register", payload);
  return data;
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<User>("/users/me");
  return data;
}

/**
 * Real call to the backend's implemented `POST /auth/refresh` (see
 * backend docs/API_CONTRACTS.md). Used by api/client.ts's response
 * interceptor to silently retry a request after a 401, and by
 * useCurrentUser's rehydration path.
 */
export async function refreshAccessToken(payload: RefreshRequest): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>("/auth/refresh", payload);
  return data;
}

/**
 * PLACEHOLDER — no backend endpoint exists for this yet (there is no
 * `POST /auth/forgot-password` in backend docs/API_CONTRACTS.md, and
 * adding one is a backend change out of scope for this frontend phase).
 *
 * This simulates a network round-trip and always resolves successfully,
 * so the ForgotPasswordForm's loading/success UI can be built and tested
 * end-to-end now. Swap this function's body for a real `apiClient.post`
 * call the moment the backend endpoint exists — no other code should need
 * to change, since callers only depend on this function's signature.
 */
export async function forgotPassword(
  payload: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    message: `If an account exists for ${payload.email}, we've sent password reset instructions.`,
  };
}
