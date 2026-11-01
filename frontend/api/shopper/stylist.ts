import { apiClient } from "@/api/client";
import type { StylistSuggestionRequest, StylistSuggestionResponse } from "@/types/shopper";

/**
 * Real call to `POST /stylist/suggestions` — the backend's rule-based
 * stylist assembles an outfit from the caller's own wardrobe, steered by
 * occasion and weather (see backend app/services/stylist_service.py).
 * An empty wardrobe still answers 200, with a rationale explaining what
 * to add.
 */
export async function requestStylistSuggestion(
  payload: StylistSuggestionRequest,
): Promise<StylistSuggestionResponse> {
  const { data } = await apiClient.post<StylistSuggestionResponse>("/stylist/suggestions", payload);
  return data;
}
