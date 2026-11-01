import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";

export type StoreOnboardingStepId = "basics" | "logo" | "details" | "social" | "complete";

export const STORE_ONBOARDING_STEPS: StoreOnboardingStepId[] = [
  "basics",
  "logo",
  "details",
  "social",
  "complete",
];

interface StoreOnboardingState {
  completedSteps: StoreOnboardingStepId[];
  currentStep: StoreOnboardingStepId;
  isComplete: boolean;
}

const INITIAL_STATE: StoreOnboardingState = {
  completedSteps: [],
  currentStep: "basics",
  isComplete: false,
};

function storageKey(userId: string): string {
  return `fitmirror.store-onboarding.${userId}`;
}

/**
 * Drives the multi-step store setup stepper's progress — mirrors
 * features/shopper/hooks/use-onboarding.ts from Phase 2.3. This is
 * UI-only progress state, distinct from the actual data each step
 * collects: "basics" creates the store with `POST /store`; "logo",
 * "details", and "social" save with `PATCH /store/me` (see
 * use-store-business-info.ts).
 */
export function useStoreOnboarding() {
  const { currentUser } = useAuth();
  const [state, setState] = useState<StoreOnboardingState>(INITIAL_STATE);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setState(INITIAL_STATE);
      setIsHydrated(true);
      return;
    }
    try {
      const raw = window.localStorage.getItem(storageKey(currentUser.id));
      setState(raw ? (JSON.parse(raw) as StoreOnboardingState) : INITIAL_STATE);
    } catch {
      setState(INITIAL_STATE);
    }
    setIsHydrated(true);
  }, [currentUser]);

  const persist = useCallback(
    (next: StoreOnboardingState) => {
      setState(next);
      if (currentUser) {
        window.localStorage.setItem(storageKey(currentUser.id), JSON.stringify(next));
      }
    },
    [currentUser],
  );

  const completeStep = useCallback(
    (step: StoreOnboardingStepId) => {
      const completedSteps = state.completedSteps.includes(step)
        ? state.completedSteps
        : [...state.completedSteps, step];
      const currentIndex = STORE_ONBOARDING_STEPS.indexOf(step);
      const nextStep = STORE_ONBOARDING_STEPS[currentIndex + 1] ?? "complete";
      persist({
        completedSteps,
        currentStep: nextStep,
        isComplete: nextStep === "complete" && step === "social",
      });
    },
    [persist, state],
  );

  const skipStep = useCallback(
    (step: StoreOnboardingStepId) => {
      const currentIndex = STORE_ONBOARDING_STEPS.indexOf(step);
      const nextStep = STORE_ONBOARDING_STEPS[currentIndex + 1] ?? "complete";
      persist({ ...state, currentStep: nextStep });
    },
    [persist, state],
  );

  return { ...state, isHydrated, completeStep, skipStep };
}
