import { useMutation, useQueryClient } from "@tanstack/react-query";

import { retryTryOnJob } from "@/api/admin/tryon-jobs";

export function useRetryTryOnJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => retryTryOnJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tryon-jobs"] });
    },
  });
}
