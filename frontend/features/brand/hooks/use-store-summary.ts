import { useQuery } from "@tanstack/react-query";

import { fetchStoreSummary } from "@/api/brand/store";

export function useStoreSummary() {
  return useQuery({
    queryKey: ["brand", "store-summary"],
    queryFn: fetchStoreSummary,
    retry: false,
  });
}
