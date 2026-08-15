import { buildDashboardSummary } from "@/features/brand/lib/dashboard-summary-adapter";
import { useProducts } from "@/features/brand/hooks/use-products";
import { useStoreBusinessInfo } from "@/features/brand/hooks/use-store-business-info";
import { useStoreSummary } from "@/features/brand/hooks/use-store-summary";

export function useDashboardSummary() {
  const summaryQuery = useStoreSummary();
  const productsQuery = useProducts();
  const businessInfoQuery = useStoreBusinessInfo();

  const isLoading = summaryQuery.isLoading || productsQuery.isLoading;
  const isError = summaryQuery.isError || productsQuery.isError;

  const viewModel =
    summaryQuery.data && !isLoading
      ? buildDashboardSummary({
          summary: summaryQuery.data,
          products: productsQuery.products,
          businessInfo: businessInfoQuery.data,
        })
      : null;

  return {
    isLoading,
    isError,
    viewModel,
    refetch: () => {
      summaryQuery.refetch();
      productsQuery.refetch();
    },
  };
}
