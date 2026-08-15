"use client";

import { ToggleLeft } from "lucide-react";

import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminGuard } from "@/features/admin/components/admin-guard";
import { FeatureFlagRow } from "@/features/admin/components/feature-flags/feature-flag-row";
import { MockedBadge } from "@/features/admin/components/mocked-badge";
import { useFeatureFlags } from "@/features/admin/hooks/use-feature-flags";

function FeatureFlagsView() {
  return (
    <AdminGuard>
      <FeatureFlagsContent />
    </AdminGuard>
  );
}

/**
 * The only admin action in Phase 2.5 that durably persists (to
 * localStorage — see api/admin/feature-flags.ts) since there's no backend
 * feature-flag model to persist it to instead. Toggling, changing scope,
 * or adjusting rollout here survives a page refresh.
 */
function FeatureFlagsContent() {
  const { data: flags, isLoading, isError, refetch } = useFeatureFlags();

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (isError || !flags) {
    return (
      <ErrorState
        description="We couldn't load feature flags. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ToggleLeft className="size-5 text-muted-foreground" aria-hidden="true" />
            <h1 className="font-display text-2xl font-semibold">Feature flags</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Toggle platform features on or off, scoped by environment and rollout.
          </p>
        </div>
        <MockedBadge label="Persisted locally, not synced to a backend" />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Flag</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Environment</TableHead>
            <TableHead>Rollout</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flags.map((flag) => (
            <FeatureFlagRow key={flag.key} flag={flag} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export { FeatureFlagsView };
