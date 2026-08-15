import { afterEach, describe, expect, it } from "vitest";

import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth-constants";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setTokens,
} from "@/lib/auth-token";

function clearAllCookies() {
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0]?.trim();
    if (name) document.cookie = `${name}=; max-age=0; path=/`;
  });
}

describe("auth-token", () => {
  afterEach(() => {
    clearAllCookies();
  });

  it("returns null for both tokens before any session exists", () => {
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it("setTokens persists both access and refresh tokens", () => {
    setTokens("access-123", "refresh-456");

    expect(getAccessToken()).toBe("access-123");
    expect(getRefreshToken()).toBe("refresh-456");
  });

  it("setAccessToken updates only the access token", () => {
    setTokens("access-1", "refresh-1");
    setAccessToken("access-2");

    expect(getAccessToken()).toBe("access-2");
    expect(getRefreshToken()).toBe("refresh-1");
  });

  it("clearTokens removes both tokens", () => {
    setTokens("access-1", "refresh-1");
    clearTokens();

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it("uses the documented cookie names", () => {
    setTokens("access-1", "refresh-1");
    expect(document.cookie).toContain(`${ACCESS_TOKEN_COOKIE}=access-1`);
    expect(document.cookie).toContain(`${REFRESH_TOKEN_COOKIE}=refresh-1`);
  });
});
