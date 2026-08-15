import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { listTryOnJobs } from "@/api/shopper/tryon";
import type { TryOnHistoryFilters } from "@/types/shopper";

const DEFAULT_FILTERS: TryOnHistoryFilters = { status: "all", search: "" };

/**
 * `GET /tryon` returns every job for the user with no pagination or
 * filters (see api/shopper/tryon.ts) — status filtering and the search
 * placeholder both apply client-side. `search` currently has nothing
 * text-based to match against (jobs carry only storage keys, no garment
 * name/title yet — see docs/frontend/SHOPPER_APP.md), so it's wired as an
 * inert UI placeholder per the Phase 2.3 spec ("Search placeholder").
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

  const filteredJobs = useMemo(() => {
    const jobs = query.data ?? [];
    if (filters.status === "all") return jobs;
    return jobs.filter((job) => job.status === filters.status);
  }, [query.data, filters]);

  return { ...query, jobs: query.data ?? [], filteredJobs, filters, setFilters };
}
