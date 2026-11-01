import { apiClient } from "@/api/client";
import type { Product, ProductVariant } from "@/types/domain";
import type { ProductCreateRequest, ProductUpdateRequest, VariantFormInput } from "@/types/brand";

/**
 * See backend docs/API_CONTRACTS.md "Store Dashboard". Every call is scoped
 * server-side to the caller's own store (another store's product answers
 * 404). Archiving is `is_archived` and the on/off-sale toggle is
 * `is_active` — both plain PATCH fields, independent of each other.
 */
export async function listProducts(): Promise<Product[]> {
  const { data } = await apiClient.get<Product[]>("/store/products");
  return data;
}

export async function createProduct(payload: ProductCreateRequest): Promise<Product> {
  const { data } = await apiClient.post<Product>("/store/products", payload);
  return data;
}

export async function updateProduct(
  productId: string,
  payload: ProductUpdateRequest,
): Promise<Product> {
  const { data } = await apiClient.patch<Product>(`/store/products/${productId}`, payload);
  return data;
}

export async function addVariant(
  productId: string,
  variant: VariantFormInput,
): Promise<ProductVariant> {
  const { data } = await apiClient.post<ProductVariant>(
    `/store/products/${productId}/variants`,
    variant,
  );
  return data;
}

export async function updateVariant(
  productId: string,
  variantId: string,
  variant: VariantFormInput,
): Promise<ProductVariant> {
  const { data } = await apiClient.patch<ProductVariant>(
    `/store/products/${productId}/variants/${variantId}`,
    variant,
  );
  return data;
}

export async function deleteVariant(productId: string, variantId: string): Promise<void> {
  await apiClient.delete(`/store/products/${productId}/variants/${variantId}`);
}
