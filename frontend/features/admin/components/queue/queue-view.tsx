"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminGuard } from "@/features/admin/components/admin-guard";
import { MockedBadge } from "@/features/admin/components/mocked-badge";
import { WorkerStatusCard } from "@/features/admin/components/queue/worker-status-card";
import { useQueueMonitoring } from "@/features/admin/hooks/use-queue-monitoring";

function QueueView() {
  return (
    <AdminGuard>
      <QueueContent />
    </AdminGuard>
  );
}

function QueueContent() {
  const { isLoading, isError, refetch, queueStats, workers } = useQueueMonitoring();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        description="We couldn't load queue status. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Queue &amp; workers</h1>
          <p className="text-sm text-muted-foreground">Celery try-on job processing.</p>
        </div>
        <MockedBadge />
      </div>

      {queueStats.map((queue) => (
        <Card key={queue.queueName}>
          <CardHeader>
            <CardTitle className="text-base capitalize">{queue.queueName} queue</CardTitle>
            <CardDescription>{queue.throughputPerMinute} jobs/min throughput</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="font-display text-2xl font-semibold">{queue.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div>
              <p className="font-display text-2xl font-semibold">{queue.processing}</p>
              <p className="text-xs text-muted-foreground">Processing</p>
            </div>
            <div>
              <p className="font-display text-2xl font-semibold text-destructive">{queue.failed}</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </CardContent>
        </Card>
      ))}

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold">Workers</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workers.map((worker) => (
            <WorkerStatusCard key={worker.id} worker={worker} />
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Retry queue</CardTitle>
              <Badge variant="secondary">Planned</Badge>
            </div>
            <CardDescription>
              Jobs automatically re-queued after a transient failure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState title="No retry queue data yet" />
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Dead-letter queue</CardTitle>
              <Badge variant="secondary">Planned</Badge>
            </div>
            <CardDescription>Jobs that exhausted all retries.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState title="No dead-letter queue data yet" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export { QueueView };
