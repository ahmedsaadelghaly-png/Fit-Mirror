import { useMutation, useQueryClient } from "@tanstack/react-query";

import { setUserRoleOverride } from "@/api/admin/users";
import type { UserRole } from "@/types/domain";

export function useChangeUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      setUserRoleOverride(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}
