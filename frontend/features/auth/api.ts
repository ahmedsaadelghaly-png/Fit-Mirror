import { apiClient } from "@/api/client";
import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  MessageResponse,
  RefreshRequest,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  TokenResponse,
  UpdateCurrentUserRequest,
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
 * `POST /auth/forgot-password` — emails a single-use reset link. The
 * answer is the same whether or not the account exists.
 */
export async function forgotPassword(payload: ForgotPasswordRequest): Promise<MessageResponse> {
  const { data } = await apiClient.post<MessageResponse>("/auth/forgot-password", payload);
  return data;
}

/** `POST /auth/reset-password` — 422 when the link is unknown, used or expired. */
export async function resetPassword(payload: ResetPasswordRequest): Promise<MessageResponse> {
  const { data } = await apiClient.post<MessageResponse>("/auth/reset-password", payload);
  return data;
}

/** `PATCH /users/me` — the user's own profile details (their name). */
export async function updateCurrentUser(payload: UpdateCurrentUserRequest): Promise<User> {
  const { data } = await apiClient.patch<User>("/users/me", payload);
  return data;
}

/**
 * `POST /users/me/delete` — signs the account out and erases it after the
 * grace period; logging in before then cancels.
 */
export async function requestAccountDeletion(password: string): Promise<{
  deletion_scheduled_for: string;
}> {
  const { data } = await apiClient.post<{ deletion_scheduled_for: string }>("/users/me/delete", {
    password,
  });
  return data;
}

/**
 * `POST /users/me/password` — returns fresh tokens for this session; other
 * sessions end at their next token refresh.
 */
export async function changePassword(payload: ChangePasswordRequest): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>("/users/me/password", payload);
  return data;
}
