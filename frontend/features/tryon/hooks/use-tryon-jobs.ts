import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { listTryOnJobs } from "@/api/shopper/tryon";
import { newestFirst } from "@/features/tryon/lib/job-display";
import type { TryOnHistoryFilters } from "@/types/shopper";

const DEFAULT_FILTERS: TryOnHistoryFilters = { status: "all", search: "" };

/**
 * `GET /tryon` returns the user's jobs with no server-side filters (see
 * api/shopper/tryon.ts) — status filtering and search (by catalog product
 * name) apply client-side. Jobs are newest first.
 */
export function useTryOnJobs() {
  const [filters, setFilters] = useState<TryOnHistoryFilters>(DEFAULT_FILTERS);

  const query = useQuery({
    queryKey: ["tryon", "jobs"],
    queryFn: listTryOnJobs,
    refetchInterval: (q) => {
      const jobs = q.state.data ?? [];
      const hasActiveJob = jobs.some(
        (job) => job.status === "pending" || job.status === "processing",
      );
      return hasActiveJob ? 3000 : false;
    },
  });

  const jobs = useMemo(() => newestFirst(query.data ?? []), [query.data]);

  const filteredJobs = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return jobs.filter(
      (job) =>
        (filters.status === "all" || job.status === filters.status) &&
        (!search || (job.product_title ?? "").toLowerCase().includes(search)),
    );
  }, [jobs, filters]);

  return { ...query, jobs, filteredJobs, filters, setFilters };
}
