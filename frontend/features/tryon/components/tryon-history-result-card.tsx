"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { tryOnJobMeta, tryOnJobTitle } from "@/features/tryon/lib/job-display";
import { LookCard } from "@/shared/components/cards/look-card";
import type { TryOnJob } from "@/types/domain";

export interface TryOnHistoryResultCardProps {
  job: TryOnJob;
  onRetry: (job: TryOnJob) => void;
  isRetrying: boolean;
}

function TryOnHistoryResultCard({ job, onRetry, isRetrying }: TryOnHistoryResultCardProps) {
  return (
    <LookCard
      imageKey={job.status === "completed" ? job.result_image_key : job.garment_image_key}
      alt={`Try-on: ${tryOnJobTitle(job)}`}
      title={tryOnJobTitle(job)}
      meta={tryOnJobMeta(job)}
      badge={<StatusChip status={job.status} />}
      actions={
        job.status === "failed" ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onRetry(job)}
            isLoading={isRetrying}
            className="rounded-full"
          >
            <RotateCcw className="size-3.5" /> Retry
          </Button>
        ) : job.status === "completed" ? (
          <Button asChild variant="secondary" size="sm" className="rounded-full">
            <Link href={`/shopper/tryon?job=${job.id}`}>View</Link>
          </Button>
        ) : undefined
      }
    />
  );
}

export { TryOnHistoryResultCard };
