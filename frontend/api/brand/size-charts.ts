import { apiClient } from "@/api/client";
import type { SizeChart } from "@/types/brand";
import type { FitSummary } from "@/types/shopper";

/** Garment categories a size chart can cover (footwear/accessories aren't sized). */
export const SIZED_CATEGORIES = ["tops", "outerwear", "dresses", "bottoms"] as const;

export async function listSizeCharts(): Promise<SizeChart[]> {
  const { data } = await apiClient.get<SizeChart[]>("/store/size-charts");
  return data;
}

/** Replaces the chart for `category` from pasted/uploaded CSV (backend parses and validates). */
export async function saveSizeChartCsv(category: string, csv: string): Promise<SizeChart> {
  const { data } = await apiClient.put<SizeChart>(`/store/size-charts/${category}`, { csv });
  return data;
}

export async function deleteSizeChart(category: string): Promise<void> {
  await apiClient.delete(`/store/size-charts/${category}`);
}

/** How shoppers say a product fits. */
export async function fetchProductFitFeedback(productId: string): Promise<FitSummary> {
  const { data } = await apiClient.get<FitSummary>(`/store/products/${productId}/fit-feedback`);
  return data;
}
