import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createWardrobeItem } from "@/api/shopper/wardrobe";

export function useCreateWardrobeItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWardrobeItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wardrobe", "list"] });
    },
  });
}
