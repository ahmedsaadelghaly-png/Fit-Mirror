import { useMutation, useQueryClient } from "@tanstack/react-query";

import { saveProductOverrides } from "@/api/brand/product-overlay";
import type { ProductOverlay } from "@/types/brand";

export function useSaveProductOverrides(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (overrides: ProductOverlay["overrides"]) =>
      saveProductOverrides(productId, overrides),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand", "product-overlay", productId] });
      queryClient.invalidateQueries({ queryKey: ["brand", "products"] });
    },
  });
}
