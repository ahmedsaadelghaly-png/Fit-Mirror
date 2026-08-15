import { apiClient } from "@/api/client";
import type { WardrobeItem } from "@/types/domain";
import type { WardrobeItemCreateRequest } from "@/types/shopper";

/** See backend docs/API_CONTRACTS.md "Smart Wardrobe". No filter query params exist server-side — callers filter the full list client-side (see features/shopper/hooks/use-wardrobe-items.ts). */
export async function listWardrobeItems(): Promise<WardrobeItem[]> {
  const { data } = await apiClient.get<WardrobeItem[]>("/wardrobe");
  return data;
}

export async function createWardrobeItem(
  payload: WardrobeItemCreateRequest,
): Promise<WardrobeItem> {
  const { data } = await apiClient.post<WardrobeItem>("/wardrobe", payload);
  return data;
}

export async function deleteWardrobeItem(itemId: string): Promise<void> {
  await apiClient.delete(`/wardrobe/${itemId}`);
}
