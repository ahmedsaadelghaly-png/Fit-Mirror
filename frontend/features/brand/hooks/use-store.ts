import { useQuery } from "@tanstack/react-query";

import { ApiError } from "@/api/client";
import { fetchMyStore } from "@/api/brand/store";

/**
 * `GET /store/me` 404s for a brand admin with no store yet — that's the
 * signal to send them through onboarding, not a fetch failure. See
 * features/brand/components/onboarding/onboarding-flow.tsx.
 */
export function useStore() {
  const query = useQuery({
    queryKey: ["brand", "store"],
    queryFn: fetchMyStore,
    retry: false,
  });

  const isMissing = query.error instanceof ApiError && query.error.status === 404;

  return { ...query, isMissing };
}
