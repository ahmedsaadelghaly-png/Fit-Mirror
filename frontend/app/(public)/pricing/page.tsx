import { Sparkles } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/ui/empty-state";
import { FashionSection } from "@/shared/components/editorial-section";

export const metadata: Metadata = {
  title: "Pricing",
  description: "FitMirror AI pricing — coming soon.",
};

/**
 * Explicitly a placeholder per Phase 2.2 scope — no pricing model has
 * been decided yet (there's no billing/subscription system in the
 * backend — see backend ROADMAP.md Phase 7 "Billing/subscription tier").
 * This page exists so the nav/footer link isn't broken, not to represent
 * a real pricing decision. Phase 2.8 restyles the container only — no
 * pricing tiers are fabricated here.
 */
export default function PricingPage() {
  return (
    <FashionSection
      headingLevel="h1"
      align="center"
      eyebrow="Pricing"
      heading="We're still working this out"
      description="FitMirror AI is in active development. Pricing plans for shoppers and brands will be announced here once they're ready."
    >
      <EmptyState
        icon={Sparkles}
        title="No pricing plans yet"
        description="Check back soon, or create a free account to explore what's available today."
        className="mx-auto w-full max-w-md"
      />
    </FashionSection>
  );
}
