import { afterEach, describe, expect, it } from "vitest";

import { deleteCookie, getCookie, setCookie } from "@/lib/cookies";

function clearAllCookies() {
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0]?.trim();
    if (name) document.cookie = `${name}=; max-age=0; path=/`;
  });
}

describe("cookies", () => {
  afterEach(() => {
    clearAllCookies();
  });

  it("returns null for a cookie that hasn't been set", () => {
    expect(getCookie("nonexistent")).toBeNull();
  });

  it("round-trips a value through set/get", () => {
    setCookie("test_cookie", "hello-world");
    expect(getCookie("test_cookie")).toBe("hello-world");
  });

  it("URL-encodes and decodes values with special characters", () => {
    setCookie("test_cookie", "a value; with special=chars");
    expect(getCookie("test_cookie")).toBe("a value; with special=chars");
  });

  it("removes a cookie via deleteCookie", () => {
    setCookie("test_cookie", "value");
    deleteCookie("test_cookie");
    expect(getCookie("test_cookie")).toBeNull();
  });

  it("does not confuse cookies with similar name prefixes", () => {
    setCookie("token", "short");
    setCookie("token_extended", "long");
    expect(getCookie("token")).toBe("short");
    expect(getCookie("token_extended")).toBe("long");
  });
});
