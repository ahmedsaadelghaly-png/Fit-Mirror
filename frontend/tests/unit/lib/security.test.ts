import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy } from "@/lib/security/csp";
import { getStaticSecurityHeaders } from "@/lib/security/headers";

describe("buildContentSecurityPolicy", () => {
  it("always includes a deny-by-default default-src", () => {
    const csp = buildContentSecurityPolicy({
      apiOrigin: "https://api.example.com",
      isDevelopment: false,
    });
    expect(csp).toContain("default-src 'self'");
  });

  it("includes the API origin in connect-src", () => {
    const csp = buildContentSecurityPolicy({
      apiOrigin: "https://api.example.com",
      isDevelopment: false,
    });
    expect(csp).toMatch(/connect-src[^;]*https:\/\/api\.example\.com/);
  });

  it("adds ws:/wss: to connect-src only in development", () => {
    const devCsp = buildContentSecurityPolicy({
      apiOrigin: "https://api.example.com",
      isDevelopment: true,
    });
    const prodCsp = buildContentSecurityPolicy({
      apiOrigin: "https://api.example.com",
      isDevelopment: false,
    });

    expect(devCsp).toMatch(/connect-src[^;]*ws:/);
    expect(prodCsp).not.toMatch(/connect-src[^;]*ws:/);
  });

  it("adds 'unsafe-eval' to script-src only in development", () => {
    const devCsp = buildContentSecurityPolicy({
      apiOrigin: "https://api.example.com",
      isDevelopment: true,
    });
    const prodCsp = buildContentSecurityPolicy({
      apiOrigin: "https://api.example.com",
      isDevelopment: false,
    });

    expect(devCsp).toMatch(/script-src[^;]*'unsafe-eval'/);
    expect(prodCsp).not.toMatch(/script-src[^;]*'unsafe-eval'/);
  });

  it("narrows img-src to the storage origin when one is configured", () => {
    const withStorage = buildContentSecurityPolicy({
      apiOrigin: "https://api.example.com",
      storageOrigin: "https://bucket.s3.amazonaws.com",
      isDevelopment: false,
    });
    const withoutStorage = buildContentSecurityPolicy({
      apiOrigin: "https://api.example.com",
      isDevelopment: false,
    });

    expect(withStorage).toMatch(/img-src[^;]*https:\/\/bucket\.s3\.amazonaws\.com/);
    expect(withoutStorage).toMatch(/img-src[^;]*https:/);
  });

  it("also allows the storage origin in connect-src — direct browser uploads PUT there, not just <img> loads", () => {
    const csp = buildContentSecurityPolicy({
      apiOrigin: "https://api.example.com",
      storageOrigin: "https://bucket.s3.amazonaws.com",
      isDevelopment: false,
    });

    expect(csp).toMatch(/connect-src[^;]*https:\/\/bucket\.s3\.amazonaws\.com/);
  });

  it("never omits frame-ancestors 'none'", () => {
    const csp = buildContentSecurityPolicy({
      apiOrigin: "https://api.example.com",
      isDevelopment: false,
    });
    expect(csp).toContain("frame-ancestors 'none'");
  });
});

describe("getStaticSecurityHeaders", () => {
  it("includes X-Frame-Options: DENY", () => {
    const headers = getStaticSecurityHeaders();
    expect(headers).toContainEqual({ key: "X-Frame-Options", value: "DENY" });
  });

  it("includes X-Content-Type-Options: nosniff", () => {
    const headers = getStaticSecurityHeaders();
    expect(headers).toContainEqual({ key: "X-Content-Type-Options", value: "nosniff" });
  });

  it("includes a Permissions-Policy that denies camera/microphone/geolocation", () => {
    const headers = getStaticSecurityHeaders();
    const permissionsPolicy = headers.find((h) => h.key === "Permissions-Policy");
    expect(permissionsPolicy?.value).toContain("camera=()");
    expect(permissionsPolicy?.value).toContain("microphone=()");
    expect(permissionsPolicy?.value).toContain("geolocation=()");
  });
});
