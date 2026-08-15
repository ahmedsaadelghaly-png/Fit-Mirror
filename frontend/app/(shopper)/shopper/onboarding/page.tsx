import type { Metadata } from "next";

import { OnboardingFlow } from "@/features/shopper/components/onboarding/onboarding-flow";

export const metadata: Metadata = { title: "Set up your profile" };

export default function ShopperOnboardingPage() {
  return <OnboardingFlow />;
}
