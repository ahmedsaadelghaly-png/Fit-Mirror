import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { User } from "@/types/domain";

/**
 * Auth state store.
 *
 * Holds `user` (persisted to localStorage, purely so the UI can render
 * "logged in as Ada" instantly on reload instead of flashing a guest
 * state while `useCurrentUser` refetches). This store does NOT hold the
 * access/refresh tokens — those live in cookies (see lib/auth-token.ts)
 * so `middleware.ts` can read them; duplicating them into localStorage
 * would just create a second source of truth to keep in sync.
 *
 * `status` distinguishes "haven't checked yet" from "checked, and
 * definitely logged out" — important on first paint so route
 * guards/UI don't flash a logged-out state before the initial
 * `useCurrentUser` check resolves. See providers/auth-provider.tsx for
 * how this is driven.
 */
export type AuthStatus = "idle" | "authenticated" | "unauthenticated";

interface AuthState {
  user: User | null;
  status: AuthStatus;
  setUser: (user: User) => void;
  setUnauthenticated: () => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      status: "idle",
      setUser: (user) => set({ user, status: "authenticated" }),
      setUnauthenticated: () => set({ user: null, status: "unauthenticated" }),
      clear: () => set({ user: null, status: "unauthenticated" }),
    }),
    {
      name: "fitmirror-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
