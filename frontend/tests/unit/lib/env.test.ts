import { afterEach, describe, expect, it, vi } from "vitest";

async function loadEnv() {
  vi.resetModules();
  return (await import("@/config/env")).env;
}

afterEach(() => vi.unstubAllEnvs());

describe("env", () => {
  it("treats empty optional URLs as unset, as Docker build args leave them", async () => {
    vi.stubEnv("NEXT_PUBLIC_S3_PUBLIC_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_S3_PUBLIC_ENDPOINT_URL", "");

    const env = await loadEnv();
    expect(env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL).toBeUndefined();
    expect(env.NEXT_PUBLIC_S3_PUBLIC_ENDPOINT_URL).toBeUndefined();
  });

  it("still rejects a value that isn't a URL", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubEnv("NEXT_PUBLIC_S3_PUBLIC_ENDPOINT_URL", "not a url");

    await expect(loadEnv()).rejects.toThrow(/Invalid environment configuration/);
  });
});
