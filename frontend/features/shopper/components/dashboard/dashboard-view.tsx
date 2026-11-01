"use client";

import { Heart, Shirt, Sparkles } from "lucide-react";

import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { QuickActionsCard } from "@/features/shopper/components/dashboard/quick-actions-card";
import { RecentTryOnsCard } from "@/features/shopper/components/dashboard/recent-tryons-card";
import { WelcomeSummaryCard } from "@/features/shopper/components/dashboard/welcome-summary-card";
import { useDashboardSummary } from "@/features/shopper/hooks/use-dashboard-summary";
import { useOnboarding } from "@/features/shopper/hooks/use-onboarding";
import { useAuth } from "@/hooks/use-auth";
import { PromoCard } from "@/shared/components/cards/promo-card";
import { StatTile } from "@/shared/components/cards/stat-tile";

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
        <Skeleton className="h-48 w-full rounded-2xl" />
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

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          icon={Shirt}
          label="Wardrobe"
          value={summary.wardrobeItemCount}
          hint={summary.wardrobeItemCount === 0 ? "Add your first piece" : "pieces ready to try on"}
          href="/shopper/wardrobe"
        />
        <StatTile
          icon={Sparkles}
          label="Try-ons"
          value={summary.tryOnJobCount}
          hint={
            summary.activeTryOnCount > 0
              ? `${summary.activeTryOnCount} in progress`
              : `${summary.completedTryOnCount} completed`
          }
          href="/shopper/tryon/history"
        />
        <StatTile
          icon={Heart}
          label="Saved looks"
          value={summary.savedLookCount}
          hint={summary.savedLookCount === 0 ? "Save a try-on you love" : "looks kept for later"}
          href="/shopper/looks"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RecentTryOnsCard jobs={summary.recentTryOnJobs} />
        <QuickActionsCard />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <PromoCard
          image="/images/models/man-flannel.jpg"
          imageAlt="Man in a plaid overshirt and sunglasses"
          title="AI Stylist"
          description="Tell it the occasion and the weather — it builds an outfit from your wardrobe."
          href="/shopper/stylist"
          cta="Get an outfit"
          badge="Beta"
        />
        <PromoCard
          image="/images/editorial/shopping.jpg"
          imageAlt="Woman in sunglasses carrying shopping bags"
          title="Shopping Assistant"
          description="Ask in plain words and get matching products — with your size."
          href="/shopper/shopping"
          cta="Ask the assistant"
          badge="Beta"
        />
      </div>
    </div>
  );
}

export { DashboardView };
