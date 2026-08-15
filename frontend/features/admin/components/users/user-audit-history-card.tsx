"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { MockedBadge } from "@/features/admin/components/mocked-badge";
import { useAuditLog } from "@/features/admin/hooks/use-audit-log";

export interface UserAuditHistoryCardProps {
  userEmail: string;
}

/** Genuinely filters the mocked audit log by actor — see api/admin/audit-log.ts for why the underlying rows are mocked. */
function UserAuditHistoryCard({ userEmail }: UserAuditHistoryCardProps) {
  const { isLoading, entries } = useAuditLog();
  const userEntries = entries.filter((entry) => entry.actor_email === userEmail);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Audit history</CardTitle>
          <CardDescription>Actions this account has taken</CardDescription>
        </div>
        <MockedBadge />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : userEntries.length === 0 ? (
          <EmptyState title="No recorded activity for this account" />
        ) : (
          <ul className="flex flex-col gap-2">
            {userEntries.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between text-sm">
                <span>
                  {entry.event_type} <span className="text-muted-foreground">→ {entry.target}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(entry.timestamp).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export { UserAuditHistoryCard };
