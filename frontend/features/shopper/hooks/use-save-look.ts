import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createSavedLook } from "@/api/shopper/saved-looks";

export function useSaveLook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSavedLook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopper", "saved-looks"] });
    },
  });
}
