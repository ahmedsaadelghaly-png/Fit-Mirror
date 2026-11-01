import { apiClient } from "@/api/client";
import type { SizeRecommendation } from "@/types/shopper";

/**
 * `POST /sizing/recommend` — matches the shopper's body profile against
 * the product's stocked sizes. Rejects with a 422 `ApiError` whose message
 * names the missing measurements when the profile isn't filled in.
 */
export async function recommendSize(productId: string): Promise<SizeRecommendation> {
  const { data } = await apiClient.post<SizeRecommendation>("/sizing/recommend", {
    product_id: productId,
  });
  return data;
}
