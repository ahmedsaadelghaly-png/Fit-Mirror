"use client";

import type { ReactNode } from "react";

import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminGuard } from "@/features/admin/hooks/use-admin-guard";

export interface AdminGuardProps {
  children: ReactNode;
}

/**
 * The shared "permission state" gate every Admin page renders through —
 * see features/admin/hooks/use-admin-guard.ts for why this exists as a
 * second check even though middleware already blocks the route.
 */
function AdminGuard({ children }: AdminGuardProps) {
  const { isChecking, hasPermission } = useAdminGuard();

  if (isChecking) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <ErrorState
        title="You don't have permission to view this page"
        description="This area is restricted to Platform Admin accounts."
      />
    );
  }

  return <>{children}</>;
}

export { AdminGuard };
