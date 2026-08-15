import type { AiServiceHealth, ServiceStatus, SystemHealthCheck } from "@/types/admin";

export interface SystemHealthSummary {
  overallStatus: ServiceStatus;
  healthyCount: number;
  degradedCount: number;
  downCount: number;
  checks: SystemHealthCheck[];
}

const STATUS_SEVERITY: Record<ServiceStatus, number> = {
  healthy: 0,
  unknown: 1,
  degraded: 2,
  down: 3,
};

/**
 * Pure adapter deriving an overall platform status from individual health
 * checks (worst-status-wins) plus the AI service's own health, folded in
 * as one more check. Kept side-effect-free and exported standalone so it's
 * unit-testable without a network call — see
 * tests/unit/features/system-health-adapter.test.ts.
 */
export function buildSystemHealthSummary(
  checks: SystemHealthCheck[],
  aiService: AiServiceHealth,
): SystemHealthSummary {
  const allChecks: SystemHealthCheck[] = [
    ...checks,
    {
      service: "AI Service",
      status: aiService.status,
      detail: `Active model: ${aiService.activeModel}`,
      isMocked: true,
    },
  ];

  const overallStatus = allChecks.reduce<ServiceStatus>((worst, check) => {
    return STATUS_SEVERITY[check.status] > STATUS_SEVERITY[worst] ? check.status : worst;
  }, "healthy");

  return {
    overallStatus,
    healthyCount: allChecks.filter((check) => check.status === "healthy").length,
    degradedCount: allChecks.filter((check) => check.status === "degraded").length,
    downCount: allChecks.filter((check) => check.status === "down").length,
    checks: allChecks,
  };
}
