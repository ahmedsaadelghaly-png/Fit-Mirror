import { apiClient } from "@/api/client";
import type { Store, StoreDashboardSummary } from "@/types/domain";
import type { StoreBusinessInfo, StoreCreateRequest } from "@/types/brand";

/**
 * See backend docs/API_CONTRACTS.md "Store Dashboard". `GET /store/me`
 * 404s for a brand admin who hasn't registered a store yet — callers
 * (features/brand/hooks/use-store.ts) treat that as "needs onboarding,"
 * not a fetch failure.
 */
export async function fetchMyStore(): Promise<Store> {
  const { data } = await apiClient.get<Store>("/store/me");
  return data;
}

export async function createStore(payload: StoreCreateRequest): Promise<Store> {
  const { data } = await apiClient.post<Store>("/store", payload);
  return data;
}

export async function fetchStoreSummary(): Promise<StoreDashboardSummary> {
  const { data } = await apiClient.get<StoreDashboardSummary>("/store/me/summary");
  return data;
}

/** Partial update of the caller's own store (business info, logo). */
export async function updateMyStore(payload: Partial<StoreBusinessInfo>): Promise<Store> {
  const { data } = await apiClient.patch<Store>("/store/me", payload);
  return data;
}
