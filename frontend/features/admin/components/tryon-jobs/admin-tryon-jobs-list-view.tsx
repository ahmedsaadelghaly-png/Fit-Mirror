"use client";

import { Sparkles } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminGuard } from "@/features/admin/components/admin-guard";
import { AdminTryOnJobsTable } from "@/features/admin/components/tryon-jobs/admin-tryon-jobs-table";
import { FailureReasonSummaryCard } from "@/features/admin/components/tryon-jobs/failure-reason-summary-card";
import { TryOnJobStatusFilter } from "@/features/admin/components/tryon-jobs/tryon-job-status-filter";
import { useAdminTryOnJobs } from "@/features/admin/hooks/use-admin-tryon-jobs";

function AdminTryOnJobsListView() {
  return (
    <AdminGuard>
      <AdminTryOnJobsListContent />
    </AdminGuard>
  );
}

function AdminTryOnJobsListContent() {
  const { isLoading, isError, refetch, jobs, filteredJobs, filters, setFilters } =
    useAdminTryOnJobs();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Try-on jobs</h1>
          <p className="text-sm text-muted-foreground">
            Every virtual try-on job across the platform.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <ErrorState
          description="We couldn't load try-on jobs. Please try again."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && jobs.length === 0 && (
        <EmptyState icon={Sparkles} title="No try-on jobs yet" />
      )}

      {!isLoading && !isError && jobs.length > 0 && (
        <>
          <FailureReasonSummaryCard jobs={jobs} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TryOnJobStatusFilter
              value={filters.status}
              onChange={(status) => setFilters({ ...filters, status })}
            />
            <Input
              placeholder="Search by shopper or store"
              className="w-64"
              value={filters.search}
              onChange={(event) => setFilters({ ...filters, search: event.target.value })}
            />
          </div>
          {filteredJobs.length === 0 ? (
            <EmptyState title="No jobs match this filter" />
          ) : (
            <AdminTryOnJobsTable jobs={filteredJobs} />
          )}
        </>
      )}
    </div>
  );
}

export { AdminTryOnJobsListView };
