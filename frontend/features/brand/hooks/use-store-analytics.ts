import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchStoreAnalytics } from "@/api/brand/analytics";

export function useStoreAnalytics(days: number) {
  return useQuery({
    queryKey: ["brand", "analytics", days],
    queryFn: () => fetchStoreAnalytics(days),
    placeholderData: keepPreviousData,
  });
}
