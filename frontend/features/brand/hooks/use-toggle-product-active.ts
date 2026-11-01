import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateProduct } from "@/api/brand/products";

export function useToggleProductActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, isActive }: { productId: string; isActive: boolean }) =>
      updateProduct(productId, { is_active: isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand", "products"] });
    },
  });
}
