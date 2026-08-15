import { useMutation, useQueryClient } from "@tanstack/react-query";

import { setStoreVerifiedOverride } from "@/api/admin/stores";

export function useVerifyStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storeId, isVerified }: { storeId: string; isVerified: boolean }) =>
      setStoreVerifiedOverride(storeId, isVerified),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "stores"] });
    },
  });
}
