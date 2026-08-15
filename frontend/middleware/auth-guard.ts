import { decodeJwtPayload, isTokenExpired } from "@/lib/jwt";
import type { UserRole } from "@/types/domain";

/** Shown when NOT authenticated at all — redirect target for protected routes. */
export const LOGIN_ROUTE = "/login";
/** Shown when authenticated but the access token expired mid-session (a
 * refresh token cookie exists, but middleware — unlike api/client.ts's
 * interceptor — doesn't attempt a network refresh on every navigation). */
export const SESSION_EXPIRED_ROUTE = "/session-expired";
/** Shown when authenticated as the wrong role for the requested route. */
export const UNAUTHORIZED_ROUTE = "/unauthorized";

/** Routes that make no sense to visit while already logged in. */
export const GUEST_ONLY_ROUTES = ["/login", "/register", "/forgot-password"];

/** Maps a protected route prefix to the single role allowed to access it. */
export const ROLE_PROTECTED_PREFIXES: Record<string, UserRole> = {
  "/shopper": "shopper",
  "/brand": "brand_admin",
  "/admin": "platform_admin",
};

export const ROLE_HOME: Record<UserRole, string> = {
  shopper: "/shopper",
  brand_admin: "/brand",
  platform_admin: "/admin",
};

export function isGuestOnlyRoute(pathname: string): boolean {
  return GUEST_ONLY_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function matchProtectedRolePrefix(pathname: string): UserRole | null {
  for (const [prefix, role] of Object.entries(ROLE_PROTECTED_PREFIXES)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return role;
    }
  }
  return null;
}

export function isProtectedRoute(pathname: string): boolean {
  return matchProtectedRolePrefix(pathname) !== null;
}

export type SessionState =
  { kind: "unauthenticated" } | { kind: "expired" } | { kind: "authenticated"; role: UserRole };

/**
 * Reads session state from the access-token cookie alone (no network
 * call — see the module docstring above for why middleware doesn't
 * attempt a refresh). `refreshTokenPresent` only affects which
 * "not currently valid" state is reported (expired vs. never logged in),
 * which in turn decides /session-expired vs. /login as the redirect.
 */
export function resolveSessionState(
  accessToken: string | undefined,
  refreshTokenPresent: boolean,
): SessionState {
  if (!accessToken) {
    return refreshTokenPresent ? { kind: "expired" } : { kind: "unauthenticated" };
  }

  const payload = decodeJwtPayload(accessToken);
  if (!payload || isTokenExpired(accessToken)) {
    return refreshTokenPresent ? { kind: "expired" } : { kind: "unauthenticated" };
  }

  const role = payload.role as UserRole | undefined;
  if (!role) {
    return { kind: "unauthenticated" };
  }

  return { kind: "authenticated", role };
}

/**
 * The full routing decision for one request. Returns `null` when the
 * request should simply proceed (public route, or an authenticated user
 * on a route they're allowed to see).
 */
export function decideRedirect(pathname: string, session: SessionState): string | null {
  const requiredRole = matchProtectedRolePrefix(pathname);
  const guestOnly = isGuestOnlyRoute(pathname);

  if (session.kind === "authenticated") {
    if (guestOnly) {
      return ROLE_HOME[session.role];
    }
    if (requiredRole && requiredRole !== session.role) {
      return UNAUTHORIZED_ROUTE;
    }
    return null;
  }

  // Not authenticated (or expired) — guest-only and fully public routes
  // are always fine; protected routes are not.
  if (!requiredRole) {
    return null;
  }

  return session.kind === "expired" ? SESSION_EXPIRED_ROUTE : LOGIN_ROUTE;
}
