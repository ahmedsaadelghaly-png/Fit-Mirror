import { apiClient } from "@/api/client";
import type { StoreAnalytics } from "@/types/brand";

/** `GET /store/analytics` — totals only; `days` can't exceed how long try-ons are kept (90). */
export async function fetchStoreAnalytics(days: number): Promise<StoreAnalytics> {
  const { data } = await apiClient.get<StoreAnalytics>("/store/analytics", { params: { days } });
  return data;
}
