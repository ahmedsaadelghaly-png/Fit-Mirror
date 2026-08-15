import { useQuery } from "@tanstack/react-query";

import { listSavedLooks } from "@/api/shopper/saved-looks";

/** See api/shopper/saved-looks.ts — localStorage-backed placeholder, no backend resource exists yet. */
export function useSavedLooks() {
  return useQuery({
    queryKey: ["shopper", "saved-looks"],
    queryFn: listSavedLooks,
  });
}
