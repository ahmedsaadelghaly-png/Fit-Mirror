import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateProduct } from "@/api/brand/products";
import type { ProductUpdateRequest } from "@/types/brand";

export function useUpdateProduct(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProductUpdateRequest) => updateProduct(productId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand", "products"] });
    },
  });
}
