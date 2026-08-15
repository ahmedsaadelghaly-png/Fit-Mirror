import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteVariant } from "@/api/brand/product-overlay";

export function useDeleteVariant(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variantId: string) => deleteVariant(productId, variantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand", "product-overlay", productId] });
      queryClient.invalidateQueries({ queryKey: ["brand", "products"] });
    },
  });
}
