import { useQuery } from "@tanstack/react-query";

import { listSavedLooks } from "@/api/shopper/saved-looks";

/** `GET /saved-looks` — see api/shopper/saved-looks.ts. */
export function useSavedLooks() {
  return useQuery({
    queryKey: ["shopper", "saved-looks"],
    queryFn: listSavedLooks,
  });
}
