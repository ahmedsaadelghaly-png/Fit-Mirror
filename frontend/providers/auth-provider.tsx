"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo } from "react";

import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { clearTokens, getAccessToken, setTokens } from "@/lib/auth-token";
import { type AuthStatus, useAuthStore } from "@/lib/stores/auth-store";
import type { TokenResponse } from "@/types/auth";
import type { User } from "@/types/domain";

/**
 * Real auth context, backed by:
 *   - lib/auth-token.ts (cookies — what middleware.ts also reads)
 *   - lib/stores/auth-store.ts (Zustand — persisted `user` for instant UI)
 *   - features/auth/hooks/use-current-user.ts (TanStack Query — the
 *     source of truth for "is this session still valid", refetched here
 *     on mount to bootstrap the store from a page refresh)
 *
 * See docs/frontend/AUTHENTICATION.md for the full session lifecycle
 * diagram this implements.
 */
interface AuthContextValue {
  currentUser: User | null;
  isAuthenticated: boolean;
  /** "idle" until the initial session check resolves — use this to avoid
   * flashing a logged-out UI before that check completes. */
  status: AuthStatus;
  login: (tokens: TokenResponse, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const setUser = useAuthStore((state) => state.setUser);
  const setUnauthenticated = useAuthStore((state) => state.setUnauthenticated);
  const clearStore = useAuthStore((state) => state.clear);

  // Only fires when an access-token cookie exists — see useCurrentUser's
  // `enabled` condition. This is what turns "a cookie survived a page
  // refresh" into "the store has the real, current user again".
  const currentUserQuery = useCurrentUser();

  useEffect(() => {
    if (!getAccessToken()) {
      setUnauthenticated();
      return;
    }
    if (currentUserQuery.data) {
      setUser(currentUserQuery.data);
    } else if (currentUserQuery.isError) {
      // The cookie existed but the token is invalid/expired and refresh
      // (handled in api/client.ts's interceptor) didn't save it.
      clearTokens();
      setUnauthenticated();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on query settlement, not every render
  }, [currentUserQuery.data, currentUserQuery.isError]);

  const login = useCallback(
    (tokens: TokenResponse, nextUser: User) => {
      setTokens(tokens.access_token, tokens.refresh_token);
      setUser(nextUser);
    },
    [setUser],
  );

  const logout = useCallback(() => {
    clearTokens();
    clearStore();
    // Drop every cached query result — the next session (even for the
    // same user) should never see stale data from this one.
    queryClient.clear();
    router.push("/login");
  }, [clearStore, queryClient, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser: user,
      isAuthenticated: status === "authenticated",
      status,
      login,
      logout,
    }),
    [user, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
