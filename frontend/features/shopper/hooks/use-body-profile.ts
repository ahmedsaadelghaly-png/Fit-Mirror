import { useQuery } from "@tanstack/react-query";

import { ApiError } from "@/api/client";
import { fetchBodyProfile } from "@/api/shopper/body-profile";

/**
 * `GET /users/me/body-profile` 404s with `BODY_PROFILE_MISSING` for a
 * shopper who hasn't set one up yet — that's an expected empty state, not
 * a fetch failure, so callers should check `isMissing` (derived from a
 * 404 `ApiError`) rather than treating every error as a generic failure.
 */
export function useBodyProfile() {
  const query = useQuery({
    queryKey: ["shopper", "body-profile"],
    queryFn: fetchBodyProfile,
    retry: false,
  });

  const isMissing = query.error instanceof ApiError && query.error.status === 404;

  return { ...query, isMissing };
}
