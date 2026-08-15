import { describe, expect, it } from "vitest";

import { featureFlagUpdateSchema } from "@/features/admin/schemas";

describe("featureFlagUpdateSchema (feature flags validation)", () => {
  it("accepts a valid environment and rollout percentage", () => {
    const result = featureFlagUpdateSchema.safeParse({
      environment: "staging",
      rolloutPercentage: 25,
    });
    expect(result.success).toBe(true);
  });

  it("accepts every known environment value", () => {
    for (const environment of ["all", "development", "staging", "production"]) {
      const result = featureFlagUpdateSchema.safeParse({ environment, rolloutPercentage: 0 });
      expect(result.success).toBe(true);
    }
  });

  it("rejects an unknown environment", () => {
    const result = featureFlagUpdateSchema.safeParse({
      environment: "canary",
      rolloutPercentage: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative rollout percentage", () => {
    const result = featureFlagUpdateSchema.safeParse({ environment: "all", rolloutPercentage: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects a rollout percentage above 100", () => {
    const result = featureFlagUpdateSchema.safeParse({
      environment: "all",
      rolloutPercentage: 101,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer rollout percentage", () => {
    const result = featureFlagUpdateSchema.safeParse({
      environment: "all",
      rolloutPercentage: 12.5,
    });
    expect(result.success).toBe(false);
  });

  it("coerces a numeric string rollout percentage (as produced by a number input)", () => {
    const result = featureFlagUpdateSchema.safeParse({
      environment: "all",
      rolloutPercentage: "50",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rolloutPercentage).toBe(50);
    }
  });
});
