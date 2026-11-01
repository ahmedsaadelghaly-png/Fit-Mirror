import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateStore } from "@/api/admin/stores";

export function useSuspendStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storeId, isSuspended }: { storeId: string; isSuspended: boolean }) =>
      updateStore(storeId, { is_suspended: isSuspended }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "stores"] });
    },
  });
}
