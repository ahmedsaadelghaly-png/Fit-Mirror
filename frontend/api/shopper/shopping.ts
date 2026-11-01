import { apiClient } from "@/api/client";
import type { ShoppingAskRequest, ShoppingAskResponse } from "@/types/shopper";

/**
 * Real call to `POST /shopping/ask` — the backend parses the query into
 * catalog filters (category, price bounds, size) plus search terms and
 * answers with ranked product IDs and a reply (see backend
 * app/services/shopping_service.py). Matched products can be loaded with
 * `GET /catalog/products?ids=...`.
 */
export async function askShoppingAssistant(
  payload: ShoppingAskRequest,
): Promise<ShoppingAskResponse> {
  const { data } = await apiClient.post<ShoppingAskResponse>("/shopping/ask", payload);
  return data;
}
