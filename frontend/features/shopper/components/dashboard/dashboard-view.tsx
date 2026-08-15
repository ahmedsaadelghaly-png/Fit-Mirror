"use client";

import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AiStylistPlaceholderCard } from "@/features/shopper/components/dashboard/ai-stylist-placeholder-card";
import { QuickActionsCard } from "@/features/shopper/components/dashboard/quick-actions-card";
import { RecentTryOnsCard } from "@/features/shopper/components/dashboard/recent-tryons-card";
import { SavedLooksSummaryCard } from "@/features/shopper/components/dashboard/saved-looks-summary-card";
import { ShoppingAssistantPlaceholderCard } from "@/features/shopper/components/dashboard/shopping-assistant-placeholder-card";
import { WardrobeSummaryCard } from "@/features/shopper/components/dashboard/wardrobe-summary-card";
import { WelcomeSummaryCard } from "@/features/shopper/components/dashboard/welcome-summary-card";
import { useDashboardSummary } from "@/features/shopper/hooks/use-dashboard-summary";
import { useOnboarding } from "@/features/shopper/hooks/use-onboarding";
import { useAuth } from "@/hooks/use-auth";

/**
 * Real dashboard — replaces the Phase 2.1 placeholder that used to live at
 * app/(shopper)/shopper/page.tsx (static StatusChip samples + a static
 * EmptyState). Every card below is wired to live TanStack Query data; see
 * features/shopper/hooks/use-dashboard-summary.ts for how the three list
 * endpoints (wardrobe, try-on jobs, saved looks) compose into the counts
 * used here.
 */
function DashboardView() {
  const { currentUser } = useAuth();
  const { isComplete: isOnboardingComplete, isHydrated } = useOnboarding();
  const summary = useDashboardSummary();

  if (!currentUser || summary.isLoading || !isHydrated) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (summary.isError) {
    return (
      <ErrorState
        description="We couldn't load your dashboard. Please try again."
        onRetry={summary.refetch}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <WelcomeSummaryCard user={currentUser} isOnboardingComplete={isOnboardingComplete} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <RecentTryOnsCard jobs={summary.recentTryOnJobs} />
        <WardrobeSummaryCard itemCount={summary.wardrobeItemCount} />
        <SavedLooksSummaryCard lookCount={summary.savedLookCount} />
        <QuickActionsCard />
        <AiStylistPlaceholderCard />
        <ShoppingAssistantPlaceholderCard />
      </div>
    </div>
  );
}

export { DashboardView };
