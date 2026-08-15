import { useMutation, useQueryClient } from "@tanstack/react-query";

import { setProductArchived } from "@/api/brand/product-overlay";

export function useArchiveProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, isArchived }: { productId: string; isArchived: boolean }) =>
      setProductArchived(productId, isArchived),
    onSuccess: (_overlay, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ["brand", "product-overlay", productId] });
      queryClient.invalidateQueries({ queryKey: ["brand", "products"] });
    },
  });
}
