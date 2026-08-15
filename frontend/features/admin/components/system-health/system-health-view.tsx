"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminGuard } from "@/features/admin/components/admin-guard";
import { MockedBadge } from "@/features/admin/components/mocked-badge";
import { ServiceStatusBadge } from "@/features/admin/components/service-status-badge";
import { useSystemHealth } from "@/features/admin/hooks/use-system-health";

function SystemHealthView() {
  return (
    <AdminGuard>
      <SystemHealthContent />
    </AdminGuard>
  );
}

function SystemHealthContent() {
  const { isLoading, isError, summary, refetch } = useSystemHealth();

  if (isLoading || !summary) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        description="We couldn't load system health. Please try again."
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">System health</h1>
          <p className="text-sm text-muted-foreground">
            Only "Backend" below is a real, live check — see each row's label.
          </p>
        </div>
        <ServiceStatusBadge status={summary.overallStatus} />
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="text-base">Service checks</CardTitle>
          <CardDescription>
            {summary.healthyCount} healthy · {summary.degradedCount} degraded · {summary.downCount}{" "}
            down
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {summary.checks.map((check) => (
            <div
              key={check.service}
              className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{check.service}</span>
                {check.isMocked ? (
                  <MockedBadge label="Mocked" />
                ) : (
                  <Badge variant="outline">Live</Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{check.detail}</span>
                <ServiceStatusBadge status={check.status} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">API uptime</CardTitle>
              <Badge variant="secondary">Planned</Badge>
            </div>
            <CardDescription>Rolling uptime percentage over time.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState title="No uptime data yet" />
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Recent errors</CardTitle>
              <Badge variant="secondary">Planned</Badge>
            </div>
            <CardDescription>Server-side exceptions from the last 24 hours.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState title="No error data yet" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export { SystemHealthView };
