import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateFeatureFlag } from "@/api/admin/feature-flags";
import type { FeatureFlag, FeatureFlagKey } from "@/types/admin";

export function useUpdateFeatureFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      key,
      changes,
    }: {
      key: FeatureFlagKey;
      changes: Partial<Pick<FeatureFlag, "enabled" | "environment" | "rolloutPercentage">>;
    }) => updateFeatureFlag(key, changes),
    onSuccess: (flags) => {
      queryClient.setQueryData(["admin", "feature-flags"], flags);
    },
  });
}
