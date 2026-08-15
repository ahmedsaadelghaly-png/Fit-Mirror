import { useQuery } from "@tanstack/react-query";

import { fetchPlatformReports } from "@/api/admin/reports";

export function useReports() {
  return useQuery({ queryKey: ["admin", "reports"], queryFn: fetchPlatformReports });
}
