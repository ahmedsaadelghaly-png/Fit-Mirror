import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteSizeChart,
  fetchProductFitFeedback,
  listSizeCharts,
  saveSizeChartCsv,
} from "@/api/brand/size-charts";

const KEY = ["brand", "size-charts"] as const;

export function useSizeCharts() {
  return useQuery({ queryKey: KEY, queryFn: listSizeCharts });
}

export function useSaveSizeChart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ category, csv }: { category: string; csv: string }) =>
      saveSizeChartCsv(category, csv),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteSizeChart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSizeChart,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useProductFitFeedback(productId: string) {
  return useQuery({
    queryKey: ["brand", "fit-feedback", productId],
    queryFn: () => fetchProductFitFeedback(productId),
  });
}
