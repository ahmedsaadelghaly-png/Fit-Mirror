import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateProduct } from "@/api/brand/products";

export function useArchiveProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, isArchived }: { productId: string; isArchived: boolean }) =>
      updateProduct(productId, { is_archived: isArchived }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand", "products"] });
    },
  });
}
