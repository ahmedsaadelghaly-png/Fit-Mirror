import { apiClient } from "@/api/client";
import type { StylistSuggestionRequest, StylistSuggestionResponse } from "@/types/shopper";

/**
 * `POST /stylist/suggestions` — the backend stylist assembles an outfit
 * from the caller's own wardrobe, steered by occasion, weather, favorite
 * colors and what the shopper has liked before (see backend
 * app/services/stylist_service.py). An empty wardrobe still answers 200,
 * with a rationale explaining what to add.
 */
export async function requestStylistSuggestion(
  payload: StylistSuggestionRequest,
): Promise<StylistSuggestionResponse> {
  const { data } = await apiClient.post<StylistSuggestionResponse>("/stylist/suggestions", payload);
  return data;
}

/** Like or dislike a suggestion — shapes the shopper's later suggestions. */
export async function sendOutfitFeedback(suggestionId: string, liked: boolean): Promise<void> {
  await apiClient.post(`/stylist/suggestions/${suggestionId}/feedback`, { liked });
}
