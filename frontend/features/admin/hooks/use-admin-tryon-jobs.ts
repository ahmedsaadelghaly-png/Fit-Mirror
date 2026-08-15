import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { listAllTryOnJobs, readRetryOverlaySync } from "@/api/admin/tryon-jobs";
import type { AdminTryOnJobFilters } from "@/types/admin";

const DEFAULT_FILTERS: AdminTryOnJobFilters = { status: "all", search: "" };

export function useAdminTryOnJobs() {
  const [filters, setFilters] = useState<AdminTryOnJobFilters>(DEFAULT_FILTERS);

  const query = useQuery({ queryKey: ["admin", "tryon-jobs"], queryFn: listAllTryOnJobs });

  const jobs = useMemo(() => query.data ?? [], [query.data]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (filters.status !== "all" && job.status !== filters.status) return false;
      if (filters.search) {
        const haystack = `${job.user_email} ${job.store_name}`.toLowerCase();
        if (!haystack.includes(filters.search.toLowerCase())) return false;
      }
      return true;
    });
  }, [jobs, filters]);

  return {
    ...query,
    jobs,
    filteredJobs,
    filters,
    setFilters,
    getRetryOverlay: readRetryOverlaySync,
  };
}
