import { useMutation } from "@tanstack/react-query";

import { recommendSize } from "@/api/shopper/sizing";

export interface SizeRequest {
  productId: string;
  /** A family profile; omitted = the shopper's own profile. */
  bodyProfileId?: string | null;
}

/** A mutation, not a query: it's computed on demand per product ("Find my size"), never prefetched. */
export function useSizeRecommendation() {
  return useMutation({
    mutationFn: ({ productId, bodyProfileId }: SizeRequest) =>
      recommendSize(productId, bodyProfileId),
  });
}
