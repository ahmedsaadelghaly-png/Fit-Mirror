import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateVariant } from "@/api/brand/products";
import type { VariantFormInput } from "@/types/brand";

export function useUpdateVariant(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ variantId, variant }: { variantId: string; variant: VariantFormInput }) =>
      updateVariant(productId, variantId, variant),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand", "products"] });
    },
  });
}
