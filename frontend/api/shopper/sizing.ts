import { apiClient } from "@/api/client";
import type { FitSummary, FitVerdict, SizeRecommendation } from "@/types/shopper";

/**
 * `POST /sizing/recommend` — matches a body profile against the product's
 * stocked sizes: the given family profile, or the shopper's own by
 * default. Rejects with a 422 `ApiError` whose message names the missing
 * measurements (or a child/adult mismatch) when it can't size.
 */
export async function recommendSize(
  productId: string,
  bodyProfileId?: string | null,
): Promise<SizeRecommendation> {
  const { data } = await apiClient.post<SizeRecommendation>("/sizing/recommend", {
    product_id: productId,
    ...(bodyProfileId ? { body_profile_id: bodyProfileId } : {}),
  });
  return data;
}

/** `POST /sizing/feedback` — one verdict per shopper per product; returns the updated summary. */
export async function reportFit(payload: {
  product_id: string;
  size_label: string;
  fit: FitVerdict;
}): Promise<FitSummary> {
  const { data } = await apiClient.post<FitSummary>("/sizing/feedback", payload);
  return data;
}
