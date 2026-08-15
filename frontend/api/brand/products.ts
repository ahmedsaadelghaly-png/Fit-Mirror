import { apiClient } from "@/api/client";
import type { Product } from "@/types/domain";
import type { ProductCreateRequest } from "@/types/brand";

/**
 * See backend docs/API_CONTRACTS.md "Store Dashboard". Only create + list
 * exist — no single-product GET, no PUT/PATCH, no DELETE (confirmed by
 * reading backend/app/api/v1/endpoints/store_dashboard.py; see
 * docs/frontend/BRAND_APP.md "API contract mismatches"). Product detail,
 * editing, archiving, and the active/inactive toggle are all handled via
 * the local overlay in api/brand/product-overlay.ts instead.
 */
export async function listProducts(): Promise<Product[]> {
  const { data } = await apiClient.get<Product[]>("/store/products");
  return data;
}

export async function createProduct(payload: ProductCreateRequest): Promise<Product> {
  const { data } = await apiClient.post<Product>("/store/products", payload);
  return data;
}
