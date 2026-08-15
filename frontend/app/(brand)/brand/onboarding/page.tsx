import type { Metadata } from "next";

import { OnboardingFlow } from "@/features/brand/components/onboarding/onboarding-flow";

export const metadata: Metadata = { title: "Set up your store" };

export default function BrandOnboardingPage() {
  return <OnboardingFlow />;
}
