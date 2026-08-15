import { describe, expect, it } from "vitest";

import {
  decideRedirect,
  isGuestOnlyRoute,
  isProtectedRoute,
  matchProtectedRolePrefix,
  resolveSessionState,
  ROLE_HOME,
  SESSION_EXPIRED_ROUTE,
  UNAUTHORIZED_ROUTE,
} from "@/middleware/auth-guard";

function fakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake-signature`;
}

const futureExp = Math.floor(Date.now() / 1000) + 3600;
const pastExp = Math.floor(Date.now() / 1000) - 3600;

describe("isGuestOnlyRoute", () => {
  it("matches /login, /register, /forgot-password", () => {
    expect(isGuestOnlyRoute("/login")).toBe(true);
    expect(isGuestOnlyRoute("/register")).toBe(true);
    expect(isGuestOnlyRoute("/forgot-password")).toBe(true);
  });

  it("does not match unrelated routes", () => {
    expect(isGuestOnlyRoute("/")).toBe(false);
    expect(isGuestOnlyRoute("/shopper")).toBe(false);
  });
});

describe("matchProtectedRolePrefix / isProtectedRoute", () => {
  it("matches exact and nested paths for each role prefix", () => {
    expect(matchProtectedRolePrefix("/shopper")).toBe("shopper");
    expect(matchProtectedRolePrefix("/shopper/wardrobe")).toBe("shopper");
    expect(matchProtectedRolePrefix("/brand/products")).toBe("brand_admin");
    expect(matchProtectedRolePrefix("/admin")).toBe("platform_admin");
  });

  it("returns null for public routes", () => {
    expect(matchProtectedRolePrefix("/")).toBeNull();
    expect(matchProtectedRolePrefix("/features")).toBeNull();
    expect(isProtectedRoute("/pricing")).toBe(false);
  });

  it("does not false-positive on a route that merely starts with the same letters", () => {
    // "/shopperx" is not "/shopper" or a subpath of it.
    expect(matchProtectedRolePrefix("/shopperx")).toBeNull();
  });
});

describe("resolveSessionState", () => {
  it("is unauthenticated with no access token and no refresh token", () => {
    expect(resolveSessionState(undefined, false)).toEqual({ kind: "unauthenticated" });
  });

  it("is expired with no access token but a refresh token present", () => {
    expect(resolveSessionState(undefined, true)).toEqual({ kind: "expired" });
  });

  it("is authenticated with a valid, unexpired token carrying a role", () => {
    const token = fakeJwt({ sub: "u1", role: "shopper", exp: futureExp, iat: 1 });
    expect(resolveSessionState(token, true)).toEqual({ kind: "authenticated", role: "shopper" });
  });

  it("is expired for a token past its exp, when a refresh token exists", () => {
    const token = fakeJwt({ sub: "u1", role: "shopper", exp: pastExp, iat: 1 });
    expect(resolveSessionState(token, true)).toEqual({ kind: "expired" });
  });

  it("is unauthenticated for an expired token with no refresh token", () => {
    const token = fakeJwt({ sub: "u1", role: "shopper", exp: pastExp, iat: 1 });
    expect(resolveSessionState(token, false)).toEqual({ kind: "unauthenticated" });
  });

  it("is unauthenticated for a valid but role-less token", () => {
    const token = fakeJwt({ sub: "u1", exp: futureExp, iat: 1 });
    expect(resolveSessionState(token, false)).toEqual({ kind: "unauthenticated" });
  });
});

describe("decideRedirect", () => {
  it("allows an authenticated shopper onto /shopper", () => {
    expect(decideRedirect("/shopper", { kind: "authenticated", role: "shopper" })).toBeNull();
  });

  it("sends an authenticated shopper away from /brand to /unauthorized", () => {
    expect(decideRedirect("/brand", { kind: "authenticated", role: "shopper" })).toBe(
      UNAUTHORIZED_ROUTE,
    );
  });

  it("sends an authenticated user away from guest-only routes to their role home", () => {
    expect(decideRedirect("/login", { kind: "authenticated", role: "brand_admin" })).toBe(
      ROLE_HOME.brand_admin,
    );
  });

  it("allows public routes for anyone, authenticated or not", () => {
    expect(decideRedirect("/features", { kind: "unauthenticated" })).toBeNull();
    expect(decideRedirect("/features", { kind: "authenticated", role: "shopper" })).toBeNull();
  });

  it("sends an unauthenticated user on a protected route to /login", () => {
    expect(decideRedirect("/admin", { kind: "unauthenticated" })).toBe("/login");
  });

  it("sends a user with an expired session on a protected route to /session-expired", () => {
    expect(decideRedirect("/admin", { kind: "expired" })).toBe(SESSION_EXPIRED_ROUTE);
  });

  it("allows guest-only routes when not authenticated", () => {
    expect(decideRedirect("/login", { kind: "unauthenticated" })).toBeNull();
    expect(decideRedirect("/register", { kind: "expired" })).toBeNull();
  });
});
