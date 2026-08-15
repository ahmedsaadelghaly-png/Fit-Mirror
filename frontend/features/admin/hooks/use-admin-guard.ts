import { useAuth } from "@/hooks/use-auth";

/**
 * `middleware/auth-guard.ts` already blocks non-`platform_admin` visitors
 * from reaching any `/admin/*` route at all (see
 * `ROLE_PROTECTED_PREFIXES`) — this is a second, defense-in-depth check at
 * render time, and the source of the explicit "permission state" every
 * Admin page renders per the Phase 2.5 UX requirements. It also covers the
 * brief window before `useAuth()`'s session check has resolved.
 */
export function useAdminGuard() {
  const { currentUser, status } = useAuth();

  const isChecking = status === "idle";
  const hasPermission = !!currentUser && currentUser.role === "platform_admin";

  return { isChecking, hasPermission, currentUser };
}
