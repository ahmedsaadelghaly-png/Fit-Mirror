import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteWardrobeItem } from "@/api/shopper/wardrobe";

export function useDeleteWardrobeItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWardrobeItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wardrobe", "list"] });
    },
  });
}
