import { useMutation, useQueryClient } from "@tanstack/react-query";

import { setProductFlagged } from "@/api/admin/products";

export function useFlagProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, isFlagged }: { productId: string; isFlagged: boolean }) =>
      setProductFlagged(productId, isFlagged),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });
}
