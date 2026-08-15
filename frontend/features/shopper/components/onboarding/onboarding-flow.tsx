"use client";

import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ONBOARDING_STEPS, useOnboarding } from "@/features/shopper/hooks/use-onboarding";
import { StepBodyProfile } from "@/features/shopper/components/onboarding/step-body-profile";
import { StepCompletion } from "@/features/shopper/components/onboarding/step-completion";
import { StepPhotoUpload } from "@/features/shopper/components/onboarding/step-photo-upload";
import { StepStylePreferences } from "@/features/shopper/components/onboarding/step-style-preferences";
import type { OnboardingStepId } from "@/types/shopper";

const STEP_LABELS: Record<OnboardingStepId, string> = {
  style: "Style",
  "body-profile": "Body profile",
  photo: "Photo",
  complete: "Done",
};

/**
 * Multi-step onboarding stepper. Progress (current step + which steps are
 * done) persists via features/shopper/hooks/use-onboarding.ts, so leaving
 * mid-flow and coming back resumes at the same step ("Skip and resume
 * support" from the Phase 2.3 spec) — each step can also be skipped
 * outright, advancing without saving that step's data.
 */
function OnboardingFlow() {
  const onboarding = useOnboarding();

  if (!onboarding.isHydrated) {
    return <Skeleton className="h-96 w-full" />;
  }

  const currentIndex = ONBOARDING_STEPS.indexOf(onboarding.currentStep);
  const progressValue = ((currentIndex + 1) / ONBOARDING_STEPS.length) * 100;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          {ONBOARDING_STEPS.map((step, index) => (
            <span key={step} className={index <= currentIndex ? "text-foreground" : undefined}>
              {STEP_LABELS[step]}
            </span>
          ))}
        </div>
        <Progress value={progressValue} aria-label="Onboarding progress" />
      </div>

      {onboarding.currentStep === "style" && (
        <StepStylePreferences
          onContinue={() => onboarding.completeStep("style")}
          onSkip={() => onboarding.skipStep("style")}
        />
      )}
      {onboarding.currentStep === "body-profile" && (
        <StepBodyProfile
          onContinue={() => onboarding.completeStep("body-profile")}
          onSkip={() => onboarding.skipStep("body-profile")}
        />
      )}
      {onboarding.currentStep === "photo" && (
        <StepPhotoUpload
          onContinue={() => onboarding.completeStep("photo")}
          onSkip={() => onboarding.skipStep("photo")}
        />
      )}
      {onboarding.currentStep === "complete" && (
        <StepCompletion onFinish={() => onboarding.goToStep("complete")} />
      )}
    </div>
  );
}

export { OnboardingFlow };
