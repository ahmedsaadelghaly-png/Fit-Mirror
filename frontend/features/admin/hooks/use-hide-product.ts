import { useMutation, useQueryClient } from "@tanstack/react-query";

import { setProductHidden } from "@/api/admin/products";

export function useHideProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, isHidden }: { productId: string; isHidden: boolean }) =>
      setProductHidden(productId, isHidden),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });
}
