import type { AxiosError } from "axios";
import { describe, expect, it } from "vitest";

import { ApiError, normalizeError } from "@/api/client";
import type { ApiErrorBody } from "@/types/api";

type NormalizableError = AxiosError<ApiErrorBody | { detail: unknown }>;

/** Builds a minimal fake AxiosError — enough for normalizeError, which
 * only reads `.response` — without needing a real HTTP round trip. */
function fakeAxiosError(response: NormalizableError["response"]): NormalizableError {
  return { response, isAxiosError: true, name: "AxiosError", message: "" } as NormalizableError;
}

describe("normalizeError", () => {
  it("produces a network_error when there is no response at all", () => {
    const error = fakeAxiosError(undefined);
    const result = normalizeError(error);

    expect(result).toBeInstanceOf(ApiError);
    expect(result.errorCode).toBe("network_error");
    expect(result.status).toBeNull();
    expect(result.message).toMatch(/could not reach the server/i);
  });

  it("extracts the backend's structured {error_code, message} envelope", () => {
    const error = fakeAxiosError({
      status: 404,
      data: { error_code: "not_found", message: "Try-on job not found." },
      statusText: "Not Found",
      headers: {},
      // @ts-expect-error - config isn't read by normalizeError
      config: {},
    });

    const result = normalizeError(error);

    expect(result.errorCode).toBe("not_found");
    expect(result.status).toBe(404);
    expect(result.message).toBe("Try-on job not found.");
  });

  it("falls back to validation_error for FastAPI's default {detail: [...]} shape", () => {
    const error = fakeAxiosError({
      status: 422,
      data: { detail: [{ type: "missing", loc: ["body", "email"], msg: "Field required" }] },
      statusText: "Unprocessable Entity",
      headers: {},
      // @ts-expect-error - config isn't read by normalizeError
      config: {},
    });

    const result = normalizeError(error);

    expect(result.errorCode).toBe("validation_error");
    expect(result.status).toBe(422);
    expect(result.message).toMatch(/check the form/i);
  });

  it("passes through a string detail message", () => {
    const error = fakeAxiosError({
      status: 401,
      data: { detail: "Not authenticated" },
      statusText: "Unauthorized",
      headers: {},
      // @ts-expect-error - config isn't read by normalizeError
      config: {},
    });

    const result = normalizeError(error);

    expect(result.message).toBe("Not authenticated");
  });

  it("falls back to internal_error for an unrecognized response shape", () => {
    const error = fakeAxiosError({
      status: 500,
      data: {} as ApiErrorBody,
      statusText: "Internal Server Error",
      headers: {},
      // @ts-expect-error - config isn't read by normalizeError
      config: {},
    });

    const result = normalizeError(error);

    expect(result.errorCode).toBe("internal_error");
    expect(result.status).toBe(500);
  });
});

describe("ApiError", () => {
  it("is a real Error subclass with the expected fields", () => {
    const error = new ApiError("Something broke", 500, "internal_error");

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ApiError");
    expect(error.message).toBe("Something broke");
    expect(error.status).toBe(500);
    expect(error.errorCode).toBe("internal_error");
  });
});
