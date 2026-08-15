import { describe, expect, it } from "vitest";

import { forgotPasswordSchema, loginSchema, registerSchema } from "@/features/auth/schemas";

describe("loginSchema", () => {
  it("accepts a valid email and non-empty password", () => {
    const result = loginSchema.safeParse({ email: "shopper@example.com", password: "anything" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "anything" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "shopper@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepts a fully valid payload", () => {
    const result = registerSchema.safeParse({
      full_name: "Ada Shopper",
      email: "shopper@example.com",
      password: "supersecret123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      full_name: "Ada Shopper",
      email: "shopper@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing full_name", () => {
    const result = registerSchema.safeParse({
      full_name: "",
      email: "shopper@example.com",
      password: "supersecret123",
    });
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("accepts a valid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "shopper@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });
});
