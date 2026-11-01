import { apiClient } from "@/api/client";
import type { SavedLook, SavedLookCreateInput } from "@/types/shopper";

/**
 * See backend docs/API_CONTRACTS.md "Saved Looks". A saved look points at
 * one of the shopper's completed try-on jobs; its image keys come from
 * that job. Saving the same job twice answers 409.
 */
export async function listSavedLooks(): Promise<SavedLook[]> {
  const { data } = await apiClient.get<SavedLook[]>("/saved-looks");
  return data;
}

export async function createSavedLook(input: SavedLookCreateInput): Promise<SavedLook> {
  const { data } = await apiClient.post<SavedLook>("/saved-looks", input);
  return data;
}

export async function deleteSavedLook(lookId: string): Promise<void> {
  await apiClient.delete(`/saved-looks/${lookId}`);
}
