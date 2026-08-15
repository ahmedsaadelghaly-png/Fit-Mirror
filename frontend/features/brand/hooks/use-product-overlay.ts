import { useQuery } from "@tanstack/react-query";

import { fetchProductOverlay } from "@/api/brand/product-overlay";

/** See api/brand/product-overlay.ts — the localStorage-backed placeholder for edits/archiving/variants. */
export function useProductOverlay(productId: string) {
  return useQuery({
    queryKey: ["brand", "product-overlay", productId],
    queryFn: () => fetchProductOverlay(productId),
  });
}
