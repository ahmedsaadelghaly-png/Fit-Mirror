/**
 * Decodes a JWT's payload WITHOUT verifying its signature.
 *
 * This is safe to use only for non-security-critical UX/routing decisions
 * (e.g. "which dashboard should middleware redirect this role to")
 * because the backend independently verifies every token's signature on
 * every real API call (see backend app/core/security.py::decode_token) —
 * a tampered token would simply fail there and every API call would 401.
 * This function must NEVER be treated as an authorization check by
 * itself. See docs/frontend/AUTHENTICATION.md "Why JWT payload decoding
 * without verification is safe here".
 *
 * Uses `atob`, not `Buffer`, so this runs in the Edge Runtime
 * (middleware.ts) as well as the browser and Node.
 */
export interface DecodedAccessToken {
  sub: string;
  type: "access" | "refresh";
  role?: string;
  iat: number;
  exp: number;
}

export function decodeJwtPayload<T = DecodedAccessToken>(token: string): T | null {
  try {
    const [, payloadSegment] = token.split(".");
    if (!payloadSegment) return null;

    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = atob(padded);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload) return true;
  return payload.exp * 1000 <= Date.now();
}
