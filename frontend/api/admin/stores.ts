import { apiClient } from "@/api/client";
import type { AdminStoreRow } from "@/types/admin";

/** Real `GET /admin/stores` — see docs/API_CONTRACTS.md "Platform Admin". */
export async function listStores(): Promise<AdminStoreRow[]> {
  const { data } = await apiClient.get<AdminStoreRow[]>("/admin/stores", {
    params: { limit: 200 },
  });
  return data;
}

/** Suspending a store hides all its products from shoppers (catalog, sizing, Shopping Assistant). */
export async function updateStore(
  storeId: string,
  changes: { is_verified?: boolean; is_suspended?: boolean },
): Promise<AdminStoreRow> {
  const { data } = await apiClient.patch<AdminStoreRow>(`/admin/stores/${storeId}`, changes);
  return data;
}
