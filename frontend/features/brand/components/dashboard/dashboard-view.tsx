"use client";

import { Package, Percent, Sparkles } from "lucide-react";

import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalyticsCard } from "@/features/brand/components/dashboard/analytics-card";
import { InventoryPlaceholderCard } from "@/features/brand/components/dashboard/inventory-placeholder-card";
import { QuickActionsCard } from "@/features/brand/components/dashboard/quick-actions-card";
import { RecentProductsCard } from "@/features/brand/components/dashboard/recent-products-card";
import { SetupChecklistCard } from "@/features/brand/components/dashboard/setup-checklist-card";
import { StoreSummaryCard } from "@/features/brand/components/dashboard/store-summary-card";
import { RequireStore } from "@/features/brand/components/require-store";
import { useDashboardSummary } from "@/features/brand/hooks/use-dashboard-summary";
import { StatTile } from "@/shared/components/cards/stat-tile";
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
        <Skeleton className="h-48 w-full rounded-2xl" />
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

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          icon={Package}
          label="Products"
          value={viewModel.productCount}
          hint={`${viewModel.activeProductCount} active`}
          href="/brand/products"
        />
        <StatTile
          icon={Sparkles}
          label="Try-ons of your products"
          value={viewModel.tryOnJobCount}
          hint={
            viewModel.tryOnJobCount === 0
              ? "Shoppers haven't tried anything on yet"
              : `${viewModel.completedTryOnCount} completed · ${viewModel.failedTryOnCount} failed`
          }
        />
        <StatTile
          icon={Percent}
          label="Try-on success rate"
          value={
            viewModel.tryOnJobCount === 0
              ? "—"
              : `${Math.round((viewModel.completedTryOnCount / viewModel.tryOnJobCount) * 100)}%`
          }
          hint="Completed out of all try-ons"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RecentProductsCard products={viewModel.recentProducts} />
        <SetupChecklistCard items={viewModel.setupChecklist} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickActionsCard />
        <InventoryPlaceholderCard />
        <AnalyticsCard />
      </div>
    </div>
  );
}

export { DashboardView };
