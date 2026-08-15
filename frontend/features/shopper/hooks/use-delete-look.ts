import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteSavedLook } from "@/api/shopper/saved-looks";

export function useDeleteLook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSavedLook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopper", "saved-looks"] });
    },
  });
}
