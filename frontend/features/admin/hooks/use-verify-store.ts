import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateStore } from "@/api/admin/stores";

export function useVerifyStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storeId, isVerified }: { storeId: string; isVerified: boolean }) =>
      updateStore(storeId, { is_verified: isVerified }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "stores"] });
    },
  });
}
