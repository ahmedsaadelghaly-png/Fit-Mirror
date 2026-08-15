import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchStoreBusinessInfo, saveStoreBusinessInfo } from "@/api/brand/store-local";
import { useStore } from "@/features/brand/hooks/use-store";
import type { StoreBusinessInfo } from "@/types/brand";

/**
 * See api/brand/store-local.ts — localStorage-backed placeholder for
 * fields (`category`/`description`/`social_links`/a usable
 * `logo_image_key`) the `Store` model and API don't support at all.
 * Namespaced per store id, so it only loads once a store exists.
 */
export function useStoreBusinessInfo() {
  const { data: store } = useStore();
  const storeId = store?.id;

  const query = useQuery({
    queryKey: ["brand", "store-business-info", storeId],
    queryFn: () => fetchStoreBusinessInfo(storeId as string),
    enabled: !!storeId,
  });

  const queryClient = useQueryClient();
  const saveMutation = useMutation({
    mutationFn: (info: StoreBusinessInfo) => saveStoreBusinessInfo(storeId as string, info),
    onSuccess: (info) => {
      queryClient.setQueryData(["brand", "store-business-info", storeId], info);
    },
  });

  return { ...query, save: saveMutation };
}
