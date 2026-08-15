import { useMutation, useQueryClient } from "@tanstack/react-query";

import { addVariant } from "@/api/brand/product-overlay";
import type { VariantFormInput } from "@/types/brand";

export function useAddVariant(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variant: VariantFormInput) => addVariant(productId, variant),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand", "product-overlay", productId] });
      queryClient.invalidateQueries({ queryKey: ["brand", "products"] });
    },
  });
}
