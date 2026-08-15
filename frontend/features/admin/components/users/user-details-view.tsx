"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminGuard } from "@/features/admin/components/admin-guard";
import { RoleChangeDialog } from "@/features/admin/components/users/role-change-dialog";
import { SessionOverviewPlaceholder } from "@/features/admin/components/users/session-overview-placeholder";
import { UserAuditHistoryCard } from "@/features/admin/components/users/user-audit-history-card";
import { UserRoleBadge } from "@/features/admin/components/users/user-role-badge";
import { useAdminUser } from "@/features/admin/hooks/use-user";
import { useToggleUserActive } from "@/features/admin/hooks/use-toggle-user-active";

export interface UserDetailsViewProps {
  userId: string;
}

function UserDetailsView({ userId }: UserDetailsViewProps) {
  return (
    <AdminGuard>
      <UserDetailsContent userId={userId} />
    </AdminGuard>
  );
}

function UserDetailsContent({ userId }: { userId: string }) {
  const { data: user, isLoading, isError, isMissing, refetch } = useAdminUser(userId);
  const toggleActiveMutation = useToggleUserActive();

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (isError) {
    return (
      <ErrorState
        description="We couldn't load this user. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  if (isMissing || !user) {
    return (
      <EmptyState
        title="User not found"
        action={
          <Button asChild size="sm">
            <Link href="/admin/users">Back to users</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold">{user.full_name ?? user.email}</h1>
            <UserRoleBadge role={user.role} />
          </div>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              toggleActiveMutation.mutate({ userId: user.id, isActive: !user.is_active })
            }
            isLoading={toggleActiveMutation.isPending}
          >
            {user.is_active ? "Deactivate" : "Activate"}
          </Button>
          <RoleChangeDialog
            userId={user.id}
            currentRole={user.role}
            trigger={<Button variant="outline">Change role</Button>}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-sm text-muted-foreground">Status</span>
            <span className="text-sm font-medium">{user.is_active ? "Active" : "Inactive"}</span>
          </div>
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-sm text-muted-foreground">Joined</span>
            <span className="text-sm font-medium">
              {new Date(user.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last login</span>
            <span className="text-sm font-medium">
              {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "Never"}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <SessionOverviewPlaceholder />
        <UserAuditHistoryCard userEmail={user.email} />
      </div>
    </div>
  );
}

export { UserDetailsView };
