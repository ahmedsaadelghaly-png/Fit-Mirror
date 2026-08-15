import { describe, expect, it } from "vitest";

import { buildSystemHealthSummary } from "@/features/admin/lib/system-health-adapter";
import type { AiServiceHealth, SystemHealthCheck } from "@/types/admin";

const aiHealthy: AiServiceHealth = {
  status: "healthy",
  activeModel: "placeholder-tryon-v0",
  modelVersion: "0.1.0",
  gpuStatus: "N/A",
  inferenceLatencyMsP50: 100,
  inferenceLatencyMsP95: 200,
  errorRatePercent: 0,
  failedInferenceJobs24h: 0,
};

describe("buildSystemHealthSummary", () => {
  it("reports healthy overall status when every check is healthy", () => {
    const checks: SystemHealthCheck[] = [
      { service: "Backend", status: "healthy", detail: "ok", isMocked: false },
      { service: "PostgreSQL", status: "healthy", detail: "ok", isMocked: true },
    ];

    const result = buildSystemHealthSummary(checks, aiHealthy);

    expect(result.overallStatus).toBe("healthy");
    expect(result.downCount).toBe(0);
  });

  it("escalates overall status to the worst individual check (down beats degraded beats healthy)", () => {
    const checks: SystemHealthCheck[] = [
      { service: "Backend", status: "healthy", detail: "ok", isMocked: false },
      { service: "Redis", status: "degraded", detail: "slow", isMocked: true },
      { service: "PostgreSQL", status: "down", detail: "unreachable", isMocked: true },
    ];

    const result = buildSystemHealthSummary(checks, aiHealthy);

    expect(result.overallStatus).toBe("down");
    expect(result.downCount).toBe(1);
    expect(result.degradedCount).toBe(1);
  });

  it("folds the AI service's own health in as one more check", () => {
    const checks: SystemHealthCheck[] = [
      { service: "Backend", status: "healthy", detail: "ok", isMocked: false },
    ];
    const degradedAi: AiServiceHealth = { ...aiHealthy, status: "degraded" };

    const result = buildSystemHealthSummary(checks, degradedAi);

    expect(result.checks).toHaveLength(2);
    expect(
      result.checks.some((check) => check.service === "AI Service" && check.status === "degraded"),
    ).toBe(true);
    expect(result.overallStatus).toBe("degraded");
  });

  it("treats unknown as worse than healthy but better than degraded", () => {
    const checks: SystemHealthCheck[] = [
      { service: "Backend", status: "healthy", detail: "ok", isMocked: false },
      { service: "Mystery", status: "unknown", detail: "no data", isMocked: true },
    ];

    const result = buildSystemHealthSummary(checks, aiHealthy);

    expect(result.overallStatus).toBe("unknown");
  });
});
