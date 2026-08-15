import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_COOKIE_MAX_AGE_SECONDS,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/auth-constants";
import { deleteCookie, getCookie, setCookie } from "@/lib/cookies";

/**
 * Real token persistence via cookies — see lib/cookies.ts's docstring for
 * why cookies (not localStorage) and the httpOnly trade-off this implies.
 * `api/client.ts`'s request interceptor reads the access token via
 * `getAccessToken()`; `middleware.ts` reads the same cookie directly
 * (it can't import this module — Edge Runtime — but uses the same cookie
 * name from lib/auth-constants.ts).
 */
export function getAccessToken(): string | null {
  return getCookie(ACCESS_TOKEN_COOKIE);
}

export function getRefreshToken(): string | null {
  return getCookie(REFRESH_TOKEN_COOKIE);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  setCookie(ACCESS_TOKEN_COOKIE, accessToken, {
    maxAgeSeconds: ACCESS_TOKEN_COOKIE_MAX_AGE_SECONDS,
  });
  setCookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    maxAgeSeconds: REFRESH_TOKEN_COOKIE_MAX_AGE_SECONDS,
  });
}

export function setAccessToken(token: string): void {
  setCookie(ACCESS_TOKEN_COOKIE, token, { maxAgeSeconds: ACCESS_TOKEN_COOKIE_MAX_AGE_SECONDS });
}

export function clearTokens(): void {
  deleteCookie(ACCESS_TOKEN_COOKIE);
  deleteCookie(REFRESH_TOKEN_COOKIE);
}
