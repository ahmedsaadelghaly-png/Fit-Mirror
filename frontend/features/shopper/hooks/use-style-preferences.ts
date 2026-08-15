import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import type { StylePreferences } from "@/types/shopper";

const EMPTY_PREFERENCES: StylePreferences = {
  preferred_fit: null,
  favorite_colors: [],
  style_preferences: [],
};

function storageKey(userId: string): string {
  return `fitmirror.style-preferences.${userId}`;
}

/**
 * Persists the frontend-only half of the body profile (see
 * types/shopper.ts `StylePreferences` for the documented backend contract
 * mismatch — `preferred_fit`/`favorite_colors`/`style_preferences` have no
 * `BodyProfileUpsert` field to write to). Namespaced to the current user id
 * so switching accounts on the same browser doesn't leak preferences.
 */
export function useStylePreferences() {
  const { currentUser } = useAuth();
  const [preferences, setPreferences] = useState<StylePreferences>(EMPTY_PREFERENCES);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setPreferences(EMPTY_PREFERENCES);
      setIsHydrated(true);
      return;
    }
    try {
      const raw = window.localStorage.getItem(storageKey(currentUser.id));
      setPreferences(raw ? (JSON.parse(raw) as StylePreferences) : EMPTY_PREFERENCES);
    } catch {
      setPreferences(EMPTY_PREFERENCES);
    }
    setIsHydrated(true);
  }, [currentUser]);

  const savePreferences = useCallback(
    (next: StylePreferences) => {
      setPreferences(next);
      if (currentUser) {
        window.localStorage.setItem(storageKey(currentUser.id), JSON.stringify(next));
      }
    },
    [currentUser],
  );

  return { preferences, savePreferences, isHydrated };
}
