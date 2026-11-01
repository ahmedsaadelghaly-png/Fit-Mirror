import { apiClient } from "@/api/client";
import type { BodyProfile } from "@/types/domain";
import type { BodyProfileCreateRequest, BodyProfileUpsertRequest } from "@/types/shopper";

/**
 * See backend docs/API_CONTRACTS.md "Users" —
 * `GET /users/me/body-profile` 404s with `BODY_PROFILE_MISSING` when the
 * shopper hasn't set one up yet; callers (features/shopper/hooks/use-body-
 * profile.ts) treat that 404 as "no profile yet", not an error state.
 */
export async function fetchBodyProfile(): Promise<BodyProfile> {
  const { data } = await apiClient.get<BodyProfile>("/users/me/body-profile");
  return data;
}

/** `PUT` doubles as create-or-update — the backend has no separate POST. */
export async function upsertBodyProfile(payload: BodyProfileUpsertRequest): Promise<BodyProfile> {
  const { data } = await apiClient.put<BodyProfile>("/users/me/body-profile", payload);
  return data;
}

// Family profiles — one account, several body profiles (the shopper's own,
// which is primary, plus e.g. each child). See docs/API_CONTRACTS.md.

/** Primary profile first, then family members in the order added. */
export async function listBodyProfiles(): Promise<BodyProfile[]> {
  const { data } = await apiClient.get<BodyProfile[]>("/users/me/body-profiles");
  return data;
}

export async function createBodyProfile(payload: BodyProfileCreateRequest): Promise<BodyProfile> {
  const { data } = await apiClient.post<BodyProfile>("/users/me/body-profiles", payload);
  return data;
}

export async function updateBodyProfile(
  profileId: string,
  payload: BodyProfileUpsertRequest,
): Promise<BodyProfile> {
  const { data } = await apiClient.put<BodyProfile>(
    `/users/me/body-profiles/${profileId}`,
    payload,
  );
  return data;
}

/** The primary profile can't be deleted (422). */
export async function deleteBodyProfile(profileId: string): Promise<void> {
  await apiClient.delete(`/users/me/body-profiles/${profileId}`);
}
