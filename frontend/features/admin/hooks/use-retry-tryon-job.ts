import { useMutation, useQueryClient } from "@tanstack/react-query";

import { requestJobRetry } from "@/api/admin/tryon-jobs";

export function useRetryTryOnJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => requestJobRetry(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tryon-jobs"] });
    },
  });
}
