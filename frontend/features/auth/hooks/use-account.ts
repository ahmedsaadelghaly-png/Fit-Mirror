import { useMutation, useQueryClient } from "@tanstack/react-query";

import { changePassword, requestAccountDeletion, updateCurrentUser } from "@/features/auth/api";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { setTokens } from "@/lib/auth-token";
import { useAuthStore } from "@/lib/stores/auth-store";

/** Saves the user's name and refreshes every place that shows the current user. */
export function useUpdateCurrentUser() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: updateCurrentUser,
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(["auth", "current-user"], user);
    },
  });
}

/** Keeps this session signed in with the fresh tokens the change returns. */
export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
    onSuccess: (tokens) => setTokens(tokens.access_token, tokens.refresh_token),
  });
}

/** The account is signed out server-side, so end this session too. */
export function useDeleteAccount() {
  const logout = useLogout();

  return useMutation({
    mutationFn: requestAccountDeletion,
    onSuccess: () => logout(),
  });
}
