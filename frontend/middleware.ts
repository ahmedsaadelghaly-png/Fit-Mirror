import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth-constants";
import { decideRedirect, resolveSessionState } from "@/middleware/auth-guard";

/**
 * Root middleware — Next.js requires this exact file location/name.
 * Actual decision logic lives in middleware/auth-guard.ts (pure,
 * unit-tested functions — see tests/unit/middleware/auth-guard.test.ts)
 * so this file stays a thin entrypoint that just wires cookies in and a
 * redirect Response out. See docs/frontend/AUTHENTICATION.md for the full
 * routing decision table this implements.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const hasRefreshToken = Boolean(request.cookies.get(REFRESH_TOKEN_COOKIE)?.value);

  const session = resolveSessionState(accessToken, hasRefreshToken);
  const redirectTarget = decideRedirect(pathname, session);

  if (!redirectTarget) {
    return NextResponse.next();
  }

  const redirectUrl = new URL(redirectTarget, request.url);
  if (redirectTarget === "/login") {
    redirectUrl.searchParams.set("redirectTo", `${pathname}${search}`);
  }
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  // Runs on every route except static assets/Next internals — needed so
  // guest-only routes (/login, /register, /forgot-password) can also be
  // redirected away from when already authenticated, not just protected
  // routes gated.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
