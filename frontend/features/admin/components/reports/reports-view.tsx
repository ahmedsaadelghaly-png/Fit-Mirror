"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminGuard } from "@/features/admin/components/admin-guard";
import { MockedBadge } from "@/features/admin/components/mocked-badge";
import { ReportCard } from "@/features/admin/components/reports/report-card";
import { useReports } from "@/features/admin/hooks/use-reports";
import { exportRowsToCsv } from "@/shared/utils/export-csv";

function ReportsView() {
  return (
    <AdminGuard>
      <ReportsContent />
    </AdminGuard>
  );
}

function ReportsContent() {
  const { data: reports, isLoading, isError, refetch } = useReports();

  const handleExport = () => {
    if (!reports) return;
    const rows = reports.userGrowth.map((point, index) => ({
      month: point.label,
      user_growth: point.value,
      store_growth: reports.storeGrowth[index]?.value ?? 0,
      tryon_usage: reports.tryOnUsage[index]?.value ?? 0,
      failed_jobs: reports.failedJobs[index]?.value ?? 0,
    }));
    exportRowsToCsv("platform-reports.csv", rows, [
      { key: "month", header: "Month" },
      { key: "user_growth", header: "User growth" },
      { key: "store_growth", header: "Store growth" },
      { key: "tryon_usage", header: "Try-on usage" },
      { key: "failed_jobs", header: "Failed jobs" },
    ]);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (isError || !reports) {
    return (
      <ErrorState
        description="We couldn't load platform reports. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  const hasAnyData = [
    reports.userGrowth,
    reports.storeGrowth,
    reports.tryOnUsage,
    reports.failedJobs,
  ].some((series) => series.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground">Platform growth and usage trends.</p>
        </div>
        <div className="flex items-center gap-2">
          <MockedBadge />
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="size-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {!hasAnyData ? (
        <EmptyState title="No report data yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <ReportCard
            title="User growth"
            description="New accounts per month"
            points={reports.userGrowth}
          />
          <ReportCard
            title="Store growth"
            description="New stores per month"
            points={reports.storeGrowth}
          />
          <ReportCard
            title="Try-on usage"
            description="Try-on jobs created per month"
            points={reports.tryOnUsage}
          />
          <ReportCard
            title="Failed jobs"
            description="Try-on jobs that failed per month"
            points={reports.failedJobs}
          />
        </div>
      )}
    </div>
  );
}

export { ReportsView };
