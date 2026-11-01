"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusChip } from "@/components/ui/status-chip";
import { AdminGuard } from "@/features/admin/components/admin-guard";
import { useAdminTryOnJob } from "@/features/admin/hooks/use-admin-tryon-job";
import { useRetryTryOnJob } from "@/features/admin/hooks/use-retry-tryon-job";
import { ResolvedImage } from "@/shared/components/resolved-image";

export interface AdminTryOnJobDetailsViewProps {
  jobId: string;
}

function AdminTryOnJobDetailsView({ jobId }: AdminTryOnJobDetailsViewProps) {
  return (
    <AdminGuard>
      <AdminTryOnJobDetailsContent jobId={jobId} />
    </AdminGuard>
  );
}

function AdminTryOnJobDetailsContent({ jobId }: { jobId: string }) {
  const { data: job, isLoading, isError, isMissing, refetch } = useAdminTryOnJob(jobId);
  const retryMutation = useRetryTryOnJob();

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (isError) {
    return (
      <ErrorState
        description="We couldn't load this job. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  if (isMissing || !job) {
    return (
      <EmptyState
        title="Job not found"
        action={
          <Button asChild size="sm">
            <Link href="/admin/tryon-jobs">Back to try-on jobs</Link>
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
            <h1 className="font-display text-xl font-semibold">Job {job.id}</h1>
            <StatusChip status={job.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {job.store_name ? `${job.user_email} · ${job.store_name}` : job.user_email}
          </p>
        </div>
        {job.status === "failed" && (
          <Button
            variant="outline"
            onClick={() => retryMutation.mutate(job.id)}
            isLoading={retryMutation.isPending}
          >
            <RotateCcw className="size-3.5" /> Retry job
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">User photo</span>
          <ResolvedImage
            imageKey={job.user_image_key}
            alt="User photo"
            className="aspect-[3/4] w-full rounded-lg"
          />
          <span className="truncate font-mono text-xs text-muted-foreground">
            {job.user_image_key}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Garment</span>
          <ResolvedImage
            imageKey={job.garment_image_key}
            alt="Garment"
            className="aspect-[3/4] w-full rounded-lg"
          />
          <span className="truncate font-mono text-xs text-muted-foreground">
            {job.garment_image_key}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Result</span>
          <ResolvedImage
            imageKey={job.result_image_key}
            alt="Result"
            className="aspect-[3/4] w-full rounded-lg"
          />
          <span className="truncate font-mono text-xs text-muted-foreground">
            {job.result_image_key ?? "Not yet generated"}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-sm text-muted-foreground">AI model</span>
            <span className="font-mono text-sm">{job.ai_model_name ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Error message</span>
            <span className="max-w-xs text-right text-sm text-destructive">
              {job.error_message ?? "—"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export { AdminTryOnJobDetailsView };
