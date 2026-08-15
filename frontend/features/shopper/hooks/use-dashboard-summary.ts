import { useQuery } from "@tanstack/react-query";

import { listSavedLooks } from "@/api/shopper/saved-looks";
import { listTryOnJobs } from "@/api/shopper/tryon";
import { listWardrobeItems } from "@/api/shopper/wardrobe";

/**
 * No dedicated `/shopper/dashboard-summary` endpoint exists on the backend
 * (only `/store/me/summary` for brand admins — see docs/API_CONTRACTS.md
 * "Store Dashboard") — this composes the three list endpoints the shopper
 * dashboard already needs individually rather than adding a new backend
 * route for a purely presentational count.
 */
export function useDashboardSummary() {
  const wardrobeQuery = useQuery({ queryKey: ["wardrobe", "list"], queryFn: listWardrobeItems });
  const tryOnQuery = useQuery({ queryKey: ["tryon", "jobs"], queryFn: listTryOnJobs });
  const savedLooksQuery = useQuery({
    queryKey: ["shopper", "saved-looks"],
    queryFn: listSavedLooks,
  });

  const isLoading = wardrobeQuery.isLoading || tryOnQuery.isLoading || savedLooksQuery.isLoading;
  const isError = wardrobeQuery.isError || tryOnQuery.isError || savedLooksQuery.isError;

  const wardrobeItems = wardrobeQuery.data ?? [];
  const tryOnJobs = tryOnQuery.data ?? [];
  const savedLooks = savedLooksQuery.data ?? [];

  return {
    isLoading,
    isError,
    refetch: () => {
      wardrobeQuery.refetch();
      tryOnQuery.refetch();
      savedLooksQuery.refetch();
    },
    wardrobeItemCount: wardrobeItems.length,
    tryOnJobCount: tryOnJobs.length,
    completedTryOnCount: tryOnJobs.filter((job) => job.status === "completed").length,
    activeTryOnCount: tryOnJobs.filter(
      (job) => job.status === "pending" || job.status === "processing",
    ).length,
    savedLookCount: savedLooks.length,
    // TryOnJob carries no timestamp field (see types/domain.ts) — the
    // backend returns jobs in insertion order, so reversing approximates
    // "most recent first" without a real `created_at` to sort by.
    recentTryOnJobs: [...tryOnJobs].reverse().slice(0, 5),
  };
}
