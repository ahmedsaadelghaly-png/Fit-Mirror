import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createTryOnJob } from "@/api/shopper/tryon";

export function useCreateTryOnJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTryOnJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tryon", "jobs"] });
    },
  });
}
