"use client";

import { Users } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminGuard } from "@/features/admin/components/admin-guard";
import { MockedBadge } from "@/features/admin/components/mocked-badge";
import { UserFiltersBar } from "@/features/admin/components/users/user-filters-bar";
import { UsersTable } from "@/features/admin/components/users/users-table";
import { useAdminUsers } from "@/features/admin/hooks/use-users";

function UsersListView() {
  return (
    <AdminGuard>
      <UsersListContent />
    </AdminGuard>
  );
}

function UsersListContent() {
  const { isLoading, isError, refetch, users, filteredUsers, filters, setFilters } =
    useAdminUsers();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">Everyone with a FitMirror AI account.</p>
        </div>
        <MockedBadge />
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <ErrorState
          description="We couldn't load the user roster. Please try again."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && users.length === 0 && (
        <EmptyState icon={Users} title="No users yet" />
      )}

      {!isLoading && !isError && users.length > 0 && (
        <>
          <UserFiltersBar filters={filters} onChange={setFilters} />
          {filteredUsers.length === 0 ? (
            <EmptyState title="No users match your filters" />
          ) : (
            <UsersTable users={filteredUsers} />
          )}
        </>
      )}
    </div>
  );
}

export { UsersListView };
