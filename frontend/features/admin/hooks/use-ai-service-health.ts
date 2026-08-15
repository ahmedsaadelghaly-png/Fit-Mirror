import { useQuery } from "@tanstack/react-query";

import { fetchAiServiceHealth } from "@/api/admin/ai-service";

export function useAiServiceHealth() {
  return useQuery({ queryKey: ["admin", "ai-service-health"], queryFn: fetchAiServiceHealth });
}
