import { useMutation, useQueryClient } from "@tanstack/react-query";

import { setProductActiveOverride } from "@/api/brand/product-overlay";

export function useToggleProductActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, isActive }: { productId: string; isActive: boolean }) =>
      setProductActiveOverride(productId, isActive),
    onSuccess: (_overlay, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ["brand", "product-overlay", productId] });
      queryClient.invalidateQueries({ queryKey: ["brand", "products"] });
    },
  });
}
