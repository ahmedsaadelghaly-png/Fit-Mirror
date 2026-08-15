import { apiClient } from "@/api/client";
import type { BodyProfile } from "@/types/domain";
import type { BodyProfileUpsertRequest } from "@/types/shopper";

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
