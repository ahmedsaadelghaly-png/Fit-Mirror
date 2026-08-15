"use client";

import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalyticsPlaceholderCard } from "@/features/brand/components/dashboard/analytics-placeholder-card";
import { InventoryPlaceholderCard } from "@/features/brand/components/dashboard/inventory-placeholder-card";
import { ProductCountCard } from "@/features/brand/components/dashboard/product-count-card";
import { QuickActionsCard } from "@/features/brand/components/dashboard/quick-actions-card";
import { RecentProductsCard } from "@/features/brand/components/dashboard/recent-products-card";
import { SetupChecklistCard } from "@/features/brand/components/dashboard/setup-checklist-card";
import { StoreSummaryCard } from "@/features/brand/components/dashboard/store-summary-card";
import { TryOnActivityCard } from "@/features/brand/components/dashboard/tryon-activity-card";
import { RequireStore } from "@/features/brand/components/require-store";
import { useDashboardSummary } from "@/features/brand/hooks/use-dashboard-summary";
import type { Store } from "@/types/domain";

/**
 * Real dashboard — replaces the Phase 2.1 placeholder that used to live at
 * app/(brand)/brand/page.tsx. See
 * features/brand/lib/dashboard-summary-adapter.ts for how
 * `GET /store/me/summary`, `GET /store/products`, and the localStorage
 * business-info overlay compose into the view model rendered here.
 */
function DashboardView() {
  return <RequireStore>{(store) => <DashboardContent store={store} />}</RequireStore>;
}

function DashboardContent({ store }: { store: Store }) {
  const { isLoading, isError, viewModel, refetch } = useDashboardSummary();

  if (isLoading || !viewModel) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        description="We couldn't load your dashboard. Please try again."
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <StoreSummaryCard store={store} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ProductCountCard
          productCount={viewModel.productCount}
          activeProductCount={viewModel.activeProductCount}
        />
        <TryOnActivityCard
          tryOnJobCount={viewModel.tryOnJobCount}
          completedTryOnCount={viewModel.completedTryOnCount}
          failedTryOnCount={viewModel.failedTryOnCount}
        />
        <SetupChecklistCard items={viewModel.setupChecklist} />
        <RecentProductsCard products={viewModel.recentProducts} />
        <QuickActionsCard />
        <InventoryPlaceholderCard />
        <AnalyticsPlaceholderCard />
      </div>
    </div>
  );
}

export { DashboardView };
