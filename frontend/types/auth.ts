import type { User } from "@/types/domain";

export type AccountType = "shopper" | "brand";

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
  /** "brand" creates a brand admin, who sets up their store after logging in. */
  account_type?: AccountType;
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

export interface MessageResponse {
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface UpdateCurrentUserRequest {
  full_name: string;
}
