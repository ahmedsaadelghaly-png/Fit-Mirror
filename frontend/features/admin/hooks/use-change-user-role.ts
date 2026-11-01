import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateUser } from "@/api/admin/users";
import type { UserRole } from "@/types/domain";

export function useChangeUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      updateUser(userId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}
