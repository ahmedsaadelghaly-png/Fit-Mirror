import { useMutation, useQueryClient } from "@tanstack/react-query";

import { setStoreSuspendedOverride } from "@/api/admin/stores";

export function useSuspendStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storeId, isSuspended }: { storeId: string; isSuspended: boolean }) =>
      setStoreSuspendedOverride(storeId, isSuspended),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "stores"] });
    },
  });
}
