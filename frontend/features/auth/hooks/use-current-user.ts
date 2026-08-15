import { useQuery } from "@tanstack/react-query";

import { fetchCurrentUser } from "@/features/auth/api";
import { getAccessToken } from "@/lib/auth-token";

/**
 * Fetches the current session's user via `GET /users/me`. Only enabled
 * when an access-token cookie exists — there's no point calling an
 * endpoint that requires auth when we already know there's no token to
 * send. Primarily consumed by providers/auth-provider.tsx to bootstrap
 * the auth store on page load/refresh; also usable directly by any
 * component that wants the current user reactively (e.g. to show a
 * loading skeleton while the session check is in flight).
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "current-user"],
    queryFn: fetchCurrentUser,
    enabled: !!getAccessToken(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
