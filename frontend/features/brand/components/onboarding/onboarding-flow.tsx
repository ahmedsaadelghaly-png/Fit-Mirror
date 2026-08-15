"use client";

import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StepCompletion } from "@/features/brand/components/onboarding/step-completion";
import { StepLogoUpload } from "@/features/brand/components/onboarding/step-logo-upload";
import { StepSocialLinks } from "@/features/brand/components/onboarding/step-social-links";
import { StepStoreBasics } from "@/features/brand/components/onboarding/step-store-basics";
import { StepStoreDetails } from "@/features/brand/components/onboarding/step-store-details";
import {
  STORE_ONBOARDING_STEPS,
  useStoreOnboarding,
} from "@/features/brand/hooks/use-store-onboarding";
import type { StoreOnboardingStepId } from "@/features/brand/hooks/use-store-onboarding";

const STEP_LABELS: Record<StoreOnboardingStepId, string> = {
  basics: "Basics",
  logo: "Logo",
  details: "Details",
  social: "Social",
  complete: "Done",
};

/**
 * Multi-step store setup stepper — mirrors
 * features/shopper/components/onboarding/onboarding-flow.tsx from Phase
 * 2.3. Only the "basics" step (name + slug) persists to a real backend
 * call; every other step writes to the localStorage-backed
 * StoreBusinessInfo overlay (see docs/frontend/BRAND_APP.md "API contract
 * mismatches").
 */
function OnboardingFlow() {
  const onboarding = useStoreOnboarding();

  if (!onboarding.isHydrated) {
    return <Skeleton className="h-96 w-full" />;
  }

  const currentIndex = STORE_ONBOARDING_STEPS.indexOf(onboarding.currentStep);
  const progressValue = ((currentIndex + 1) / STORE_ONBOARDING_STEPS.length) * 100;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          {STORE_ONBOARDING_STEPS.map((step, index) => (
            <span key={step} className={index <= currentIndex ? "text-foreground" : undefined}>
              {STEP_LABELS[step]}
            </span>
          ))}
        </div>
        <Progress value={progressValue} aria-label="Store setup progress" />
      </div>

      {onboarding.currentStep === "basics" && (
        <StepStoreBasics onContinue={() => onboarding.completeStep("basics")} />
      )}
      {onboarding.currentStep === "logo" && (
        <StepLogoUpload
          onContinue={() => onboarding.completeStep("logo")}
          onSkip={() => onboarding.skipStep("logo")}
        />
      )}
      {onboarding.currentStep === "details" && (
        <StepStoreDetails
          onContinue={() => onboarding.completeStep("details")}
          onSkip={() => onboarding.skipStep("details")}
        />
      )}
      {onboarding.currentStep === "social" && (
        <StepSocialLinks
          onContinue={() => onboarding.completeStep("social")}
          onSkip={() => onboarding.skipStep("social")}
        />
      )}
      {onboarding.currentStep === "complete" && <StepCompletion />}
    </div>
  );
}

export { OnboardingFlow };
