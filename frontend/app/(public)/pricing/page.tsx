import { Sparkles } from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Pricing",
  description: "FitMirror AI pricing — coming soon.",
};

/**
 * Explicitly a placeholder per Phase 2.2 scope — no pricing model has
 * been decided yet (there's no billing/subscription system in the
 * backend — see backend ROADMAP.md Phase 7 "Billing/subscription tier").
 * This page exists so the nav/footer link isn't broken, not to represent
 * a real pricing decision.
 */
export default function PricingPage() {
  return (
    <div className="container flex flex-col items-center gap-8 py-24 text-center">
      <Badge variant="outline">Pricing</Badge>
      <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
        We&apos;re still working this out
      </h1>
      <p className="max-w-lg text-lg text-muted-foreground">
        FitMirror AI is in active development. Pricing plans for shoppers and brands will be
        announced here once they&apos;re ready.
      </p>
      <EmptyState
        icon={Sparkles}
        title="No pricing plans yet"
        description="Check back soon, or create a free account to explore what's available today."
        className="w-full max-w-md"
      />
    </div>
  );
}
