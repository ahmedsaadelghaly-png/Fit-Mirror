import { apiClient } from "@/api/client";
import type { Product } from "@/types/domain";

/**
 * `GET /catalog/products?ids=...` — shopper-visible products only (active,
 * not archived, store not suspended), returned in the order of `ids`
 * (e.g. the Shopping Assistant's relevance rank).
 */
export async function listCatalogProductsByIds(ids: string[]): Promise<Product[]> {
  const { data } = await apiClient.get<Product[]>("/catalog/products", {
    params: { ids },
    // FastAPI reads repeated keys (ids=a&ids=b), not Axios' default ids[]=a.
    paramsSerializer: { indexes: null },
  });
  return data;
}
