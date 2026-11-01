import { useMutation } from "@tanstack/react-query";

import { recommendSize } from "@/api/shopper/sizing";

/** A mutation, not a query: it's computed on demand per product ("Find my size"), never prefetched. */
export function useSizeRecommendation() {
  return useMutation({ mutationFn: recommendSize });
}
