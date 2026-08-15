import { useQuery } from "@tanstack/react-query";

import { listFeatureFlags } from "@/api/admin/feature-flags";

export function useFeatureFlags() {
  return useQuery({ queryKey: ["admin", "feature-flags"], queryFn: listFeatureFlags });
}
