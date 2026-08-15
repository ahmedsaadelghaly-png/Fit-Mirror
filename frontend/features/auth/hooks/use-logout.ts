import { useAuth } from "@/hooks/use-auth";

/**
 * Thin wrapper around `useAuth().logout` for symmetry with
 * useLogin/useRegister — logout has no backend call to make (JWTs are
 * stateless; there's nothing to revoke server-side, see backend
 * docs/SECURITY.md "JWT"), so this is synchronous, not a mutation.
 */
export function useLogout() {
  const { logout } = useAuth();
  return logout;
}
