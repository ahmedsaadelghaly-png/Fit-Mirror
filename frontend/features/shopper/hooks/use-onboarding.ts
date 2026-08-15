import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import type { OnboardingState, OnboardingStepId } from "@/types/shopper";

export const ONBOARDING_STEPS: OnboardingStepId[] = ["style", "body-profile", "photo", "complete"];

const INITIAL_STATE: OnboardingState = {
  completedSteps: [],
  currentStep: "style",
  isComplete: false,
};

function storageKey(userId: string): string {
  return `fitmirror.onboarding.${userId}`;
}

/**
 * Drives the multi-step onboarding flow's progress, persisted to
 * localStorage per user so a shopper who navigates away mid-flow resumes
 * where they left off ("Skip and resume support" in the Phase 2.3 spec).
 * There is no backend "onboarding progress" resource — this is UI-only
 * state, distinct from the body profile / style preferences data the
 * steps themselves collect (those persist via their own hooks).
 */
export function useOnboarding() {
  const { currentUser } = useAuth();
  const [state, setState] = useState<OnboardingState>(INITIAL_STATE);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setState(INITIAL_STATE);
      setIsHydrated(true);
      return;
    }
    try {
      const raw = window.localStorage.getItem(storageKey(currentUser.id));
      setState(raw ? (JSON.parse(raw) as OnboardingState) : INITIAL_STATE);
    } catch {
      setState(INITIAL_STATE);
    }
    setIsHydrated(true);
  }, [currentUser]);

  const persist = useCallback(
    (next: OnboardingState) => {
      setState(next);
      if (currentUser) {
        window.localStorage.setItem(storageKey(currentUser.id), JSON.stringify(next));
      }
    },
    [currentUser],
  );

  const goToStep = useCallback(
    (step: OnboardingStepId) => {
      persist({ ...state, currentStep: step });
    },
    [persist, state],
  );

  const completeStep = useCallback(
    (step: OnboardingStepId) => {
      const completedSteps = state.completedSteps.includes(step)
        ? state.completedSteps
        : [...state.completedSteps, step];
      const currentIndex = ONBOARDING_STEPS.indexOf(step);
      const nextStep = ONBOARDING_STEPS[currentIndex + 1] ?? "complete";
      persist({
        completedSteps,
        currentStep: nextStep,
        isComplete: nextStep === "complete" && step === "photo",
      });
    },
    [persist, state],
  );

  const skipStep = useCallback(
    (step: OnboardingStepId) => {
      const currentIndex = ONBOARDING_STEPS.indexOf(step);
      const nextStep = ONBOARDING_STEPS[currentIndex + 1] ?? "complete";
      persist({ ...state, currentStep: nextStep });
    },
    [persist, state],
  );

  const reset = useCallback(() => persist(INITIAL_STATE), [persist]);

  return { ...state, isHydrated, goToStep, completeStep, skipStep, reset };
}
