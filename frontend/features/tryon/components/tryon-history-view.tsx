"use client";

import { Search, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TryOnHistoryResultCard } from "@/features/tryon/components/tryon-history-result-card";
import { TryOnStatusFilter } from "@/features/tryon/components/tryon-status-filter";
import { useCreateTryOnJob } from "@/features/tryon/hooks/use-create-tryon-job";
import { useTryOnJobs } from "@/features/tryon/hooks/use-tryon-jobs";
import { retryPayload } from "@/features/tryon/lib/job-display";
import type { TryOnJob } from "@/types/domain";

function TryOnHistoryView() {
  const { isLoading, isError, refetch, jobs, filteredJobs, filters, setFilters } = useTryOnJobs();
  const retryMutation = useCreateTryOnJob();

  const handleRetry = (job: TryOnJob) => {
    retryMutation.mutate(retryPayload(job));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Try-on history</h1>
          <p className="text-sm text-muted-foreground">Every try-on job you&apos;ve created.</p>
        </div>
        <Button asChild size="sm">
          <Link href="/shopper/tryon">
            <Sparkles className="size-4" /> New try-on
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[3/4] w-full" />
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <ErrorState
          description="We couldn't load your try-on history. Please try again."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && jobs.length === 0 && (
        <EmptyState
          icon={Sparkles}
          title="No try-ons yet"
          description="Start your first virtual try-on to see it show up here."
          action={
            <Button asChild size="sm">
              <Link href="/shopper/tryon">Start a try-on</Link>
            </Button>
          }
        />
      )}

      {!isLoading && !isError && jobs.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TryOnStatusFilter
              value={filters.status}
              onChange={(status) => setFilters({ ...filters, status })}
            />
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                aria-label="Search try-ons by product"
                placeholder="Search by product"
                className="w-56 pl-9"
                value={filters.search}
                onChange={(event) => setFilters({ ...filters, search: event.target.value })}
              />
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <EmptyState title="No try-ons match this filter" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredJobs.map((job) => (
                <TryOnHistoryResultCard
                  key={job.id}
                  job={job}
                  onRetry={handleRetry}
                  isRetrying={retryMutation.isPending}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export { TryOnHistoryView };
