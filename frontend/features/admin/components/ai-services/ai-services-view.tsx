"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminGuard } from "@/features/admin/components/admin-guard";
import { MockedBadge } from "@/features/admin/components/mocked-badge";
import { ServiceStatusBadge } from "@/features/admin/components/service-status-badge";
import { useAiServiceHealth } from "@/features/admin/hooks/use-ai-service-health";

function AiServicesView() {
  return (
    <AdminGuard>
      <AiServicesContent />
    </AdminGuard>
  );
}

/**
 * KNOWN CONTRACT MISMATCH — the AI service's real `GET /api/v1/health` is
 * only reachable inside the Docker network; the main backend proxies
 * nothing to it (see docs/frontend/ADMIN_APP.md). Everything here is
 * mocked via api/admin/ai-service.ts.
 */
function AiServicesContent() {
  const { data: health, isLoading, isError, refetch } = useAiServiceHealth();

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (isError || !health) {
    return (
      <ErrorState
        description="We couldn't load AI service status. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">AI services</h1>
          <p className="text-sm text-muted-foreground">The try-on generation pipeline.</p>
        </div>
        <MockedBadge />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Active model</CardTitle>
            <CardDescription>{health.activeModel}</CardDescription>
          </div>
          <ServiceStatusBadge status={health.status} />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Model version</p>
            <p className="font-mono text-sm">{health.modelVersion}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">GPU status</p>
            <p className="text-sm">{health.gpuStatus}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Latency (p50 / p95)</p>
            <p className="font-mono text-sm">
              {health.inferenceLatencyMsP50}ms / {health.inferenceLatencyMsP95}ms
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Error rate</p>
            <p className="font-mono text-sm">{health.errorRatePercent}%</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Failed inference jobs (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <span className="font-display text-3xl font-semibold text-destructive">
            {health.failedInferenceJobs24h}
          </span>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Model registry</CardTitle>
            <Badge variant="secondary">Planned</Badge>
          </div>
          <CardDescription>Browse and roll back between model versions.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState title="No registry data yet" />
        </CardContent>
      </Card>
    </div>
  );
}

export { AiServicesView };
