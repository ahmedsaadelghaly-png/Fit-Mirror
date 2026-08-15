import type { User } from "@/types/domain";

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export type RegisterResponse = User;

export interface ForgotPasswordRequest {
  email: string;
}

/** See features/auth/api.ts::forgotPassword — no backend endpoint exists yet. */
export interface ForgotPasswordResponse {
  message: string;
}
