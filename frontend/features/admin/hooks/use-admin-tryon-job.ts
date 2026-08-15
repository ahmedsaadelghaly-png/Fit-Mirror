import { useQuery } from "@tanstack/react-query";

import { listAllTryOnJobs } from "@/api/admin/tryon-jobs";

export function useAdminTryOnJob(jobId: string) {
  const query = useQuery({ queryKey: ["admin", "tryon-jobs"], queryFn: listAllTryOnJobs });

  const job = query.data?.find((item) => item.id === jobId);

  return { ...query, data: job, isMissing: !query.isLoading && !query.isError && !job };
}
