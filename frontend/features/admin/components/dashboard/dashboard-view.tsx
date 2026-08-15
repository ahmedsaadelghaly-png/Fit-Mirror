"use client";

import { Shirt, Sparkles, Store, Users } from "lucide-react";

import { ErrorBoundary } from "@/components/error-boundary";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminGuard } from "@/features/admin/components/admin-guard";
import { AiHealthSummaryCard } from "@/features/admin/components/dashboard/ai-health-summary-card";
import { AlertsPanel } from "@/features/admin/components/dashboard/alerts-panel";
import { QueueSummaryCard } from "@/features/admin/components/dashboard/queue-summary-card";
import { QuickActionsCard } from "@/features/admin/components/dashboard/quick-actions-card";
import { StatSummaryCard } from "@/features/admin/components/dashboard/stat-summary-card";
import { StorageUsagePlaceholderCard } from "@/features/admin/components/dashboard/storage-usage-placeholder-card";
import { useAdminDashboardSummary } from "@/features/admin/hooks/use-admin-dashboard-summary";
import { useAiServiceHealth } from "@/features/admin/hooks/use-ai-service-health";

/**
 * Platform control center — see docs/frontend/ADMIN_APP.md for exactly
 * which pieces here are backed by the one real endpoint (`GET /health`,
 * surfaced on /admin/system-health) versus the mocked fixtures every
 * `MockedBadge` calls out explicitly.
 */
function DashboardView() {
  return (
    <AdminGuard>
      <DashboardContent />
    </AdminGuard>
  );
}

function DashboardContent() {
  const { isLoading, isError, summary, refetch } = useAdminDashboardSummary();
  const aiHealthQuery = useAiServiceHealth();

  if (isLoading || !summary || !aiHealthQuery.data) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        description="We couldn't load the platform dashboard. Please try again."
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Platform overview</h1>
        <p className="text-sm text-muted-foreground">
          Users, stores, catalog, and try-on activity across all of FitMirror AI.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatSummaryCard
          icon={Users}
          title="Users"
          description={`${summary.activeUserCount} active`}
          value={summary.userCount}
          href="/admin/users"
          linkLabel="Manage"
        />
        <StatSummaryCard
          icon={Store}
          title="Stores"
          description={`${summary.verifiedStoreCount} verified`}
          value={summary.storeCount}
          href="/admin/stores"
          linkLabel="Manage"
        />
        <StatSummaryCard
          icon={Shirt}
          title="Products"
          description={`${summary.activeProductCount} active`}
          value={summary.productCount}
          href="/admin/products"
          linkLabel="Monitor"
        />
        <StatSummaryCard
          icon={Sparkles}
          title="Try-on jobs"
          description={`${summary.tryOnJobsByStatus.failed ?? 0} failed`}
          value={summary.tryOnJobCount}
          href="/admin/tryon-jobs"
          linkLabel="Monitor"
        />
        <AiHealthSummaryCard health={aiHealthQuery.data} />
        <QueueSummaryCard
          pending={summary.queuePendingTotal}
          processing={summary.queueProcessingTotal}
          failed={summary.queueFailedTotal}
        />
        <StorageUsagePlaceholderCard />
        {/* Real example usage of ErrorBoundary — see components/error-boundary/error-boundary.tsx.
            If AlertsPanel throws, only this tile falls back; the rest of the dashboard stays interactive. */}
        <ErrorBoundary context="admin-dashboard.alerts-panel">
          <AlertsPanel alerts={summary.alerts} />
        </ErrorBoundary>
        <QuickActionsCard />
      </div>
    </div>
  );
}

export { DashboardView };
