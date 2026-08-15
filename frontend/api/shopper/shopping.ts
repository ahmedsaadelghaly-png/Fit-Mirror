import type { ShoppingAskRequest, ShoppingAskResponse } from "@/types/shopper";

/**
 * PLACEHOLDER — `POST /shopping/ask` returns `501` on the backend today
 * (see docs/API_CONTRACTS.md "AI Stylist, Size Recommendation, Shopping
 * Assistant", ROADMAP.md Phase 5). Same simulated-round-trip pattern as
 * api/shopper/stylist.ts — swap for a real `apiClient.post` call once the
 * backend implements it.
 */
export async function askShoppingAssistant(
  payload: ShoppingAskRequest,
): Promise<ShoppingAskResponse> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    matched_product_ids: [],
    reply: `Shopping Assistant is a planned feature — once live, "${payload.query}" will be answered from the product catalog instead of shown as a placeholder.`,
  };
}
