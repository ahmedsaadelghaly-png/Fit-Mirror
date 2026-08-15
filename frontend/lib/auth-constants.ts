/**
 * Shared between client code (lib/auth-token.ts) and edge middleware
 * (middleware/auth-guard.ts) — kept dependency-free so it's safe to import
 * from the Edge Runtime, which doesn't support arbitrary Node APIs.
 */
export const ACCESS_TOKEN_COOKIE = "fm_access_token";
export const REFRESH_TOKEN_COOKIE = "fm_refresh_token";

/** Matches the backend's access token lifetime default (60 min) — see
 * backend/.env.example ACCESS_TOKEN_EXPIRE_MINUTES. Kept slightly shorter
 * than the JWT's own `exp` so the cookie never outlives the token it
 * holds. */
export const ACCESS_TOKEN_COOKIE_MAX_AGE_SECONDS = 55 * 60;
/** Matches the backend's refresh token lifetime default (7 days). */
export const REFRESH_TOKEN_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
