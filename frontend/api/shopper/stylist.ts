import type { StylistSuggestionRequest, StylistSuggestionResponse } from "@/types/shopper";

/**
 * PLACEHOLDER — `POST /stylist/suggestions` returns `501` on the backend
 * today (see docs/API_CONTRACTS.md "AI Stylist, Size Recommendation,
 * Shopping Assistant", ROADMAP.md Phase 3). Follows the same simulated-
 * round-trip pattern as features/auth/api.ts::forgotPassword so the AI
 * Stylist placeholder page's loading/response UI can be built now. Swap
 * for a real `apiClient.post("/stylist/suggestions", payload)` call the
 * moment the backend implements it — the response shape here already
 * matches the contract's "Planned Response" column.
 */
export async function requestStylistSuggestion(
  payload: StylistSuggestionRequest,
): Promise<StylistSuggestionResponse> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  const occasionNote = payload.occasion ? ` for "${payload.occasion}"` : "";
  return {
    suggestion_id: crypto.randomUUID(),
    wardrobe_item_ids: [],
    rationale: `AI Stylist is a planned feature — once live, this reply${occasionNote} will be generated from your wardrobe and style profile instead of shown as a placeholder.`,
  };
}
