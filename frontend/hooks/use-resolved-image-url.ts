import { useQuery } from "@tanstack/react-query";

import { requestDownloadUrl } from "@/api/storage";
import { STALE_TIME } from "@/lib/performance/query-config";

/**
 * Resolves a storage object key to a real, loadable image URL via
 * `GET /tryon/download-url` (see `api/storage.ts`) — used by
 * `shared/components/resolved-image.tsx` for every wardrobe/try-on/product
 * image across Shopper, Brand, and Admin. `STALE_TIME.LONG` (5 min) is
 * comfortably inside the backend's 1-hour presigned URL expiry, so a
 * cached URL is never served past the point it'd actually fail to load.
 */
export function useResolvedImageUrl(key: string | null | undefined) {
  return useQuery({
    queryKey: ["storage", "download-url", key],
    queryFn: () => requestDownloadUrl(key as string),
    enabled: !!key,
    staleTime: STALE_TIME.LONG,
  });
}
