import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateMyStore } from "@/api/brand/store";
import { useStore } from "@/features/brand/hooks/use-store";
import type { StoreBusinessInfo } from "@/types/brand";
import type { Store } from "@/types/domain";

function toBusinessInfo(store: Store): StoreBusinessInfo {
  return {
    category: store.category,
    description: store.description,
    social_links: store.social_links,
    logo_image_key: store.logo_image_key,
  };
}

/**
 * The store's business info (category, description, social links, logo)
 * — read from `GET /store/me`, saved with `PATCH /store/me`.
 */
export function useStoreBusinessInfo() {
  const storeQuery = useStore();
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: (info: StoreBusinessInfo) => updateMyStore(info),
    onSuccess: (store) => {
      queryClient.setQueryData(["brand", "store"], store);
    },
  });

  return {
    data: storeQuery.data ? toBusinessInfo(storeQuery.data) : undefined,
    isLoading: storeQuery.isLoading,
    save,
  };
}
