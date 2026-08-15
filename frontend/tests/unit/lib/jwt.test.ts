import { describe, expect, it } from "vitest";

import { decodeJwtPayload, isTokenExpired } from "@/lib/jwt";

/** Builds a fake (unsigned) JWT string — good enough since these helpers
 * never verify the signature; see lib/jwt.ts's docstring for why that's
 * safe here. */
function fakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake-signature`;
}

describe("decodeJwtPayload", () => {
  it("decodes a well-formed token's payload", () => {
    const token = fakeJwt({ sub: "user-1", role: "shopper", exp: 9999999999, iat: 1 });
    const payload = decodeJwtPayload(token);

    expect(payload).toEqual({ sub: "user-1", role: "shopper", exp: 9999999999, iat: 1 });
  });

  it("returns null for a malformed token", () => {
    expect(decodeJwtPayload("not-a-jwt")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(decodeJwtPayload("")).toBeNull();
  });

  it("handles base64url characters (- and _) correctly", () => {
    // Construct a payload whose base64 encoding is likely to contain
    // + or / in standard base64, to exercise the -/_ replacement path.
    const token = fakeJwt({ sub: "????>>>???", role: "brand_admin", exp: 1, iat: 1 });
    const payload = decodeJwtPayload(token);
    expect(payload?.role).toBe("brand_admin");
  });
});

describe("isTokenExpired", () => {
  it("returns false for a token with a future exp", () => {
    const token = fakeJwt({ sub: "u1", exp: Math.floor(Date.now() / 1000) + 3600, iat: 1 });
    expect(isTokenExpired(token)).toBe(false);
  });

  it("returns true for a token with a past exp", () => {
    const token = fakeJwt({ sub: "u1", exp: Math.floor(Date.now() / 1000) - 3600, iat: 1 });
    expect(isTokenExpired(token)).toBe(true);
  });

  it("returns true for an undecodable token", () => {
    expect(isTokenExpired("garbage")).toBe(true);
  });
});
