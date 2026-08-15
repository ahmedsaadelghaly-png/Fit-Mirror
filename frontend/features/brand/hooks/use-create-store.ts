import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createStore } from "@/api/brand/store";

export function useCreateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStore,
    onSuccess: (store) => {
      queryClient.setQueryData(["brand", "store"], store);
    },
  });
}
