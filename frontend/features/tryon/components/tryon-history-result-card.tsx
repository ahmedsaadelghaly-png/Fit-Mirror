"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import { ResolvedImage } from "@/shared/components/resolved-image";
import type { TryOnJob } from "@/types/domain";

export interface TryOnHistoryResultCardProps {
  job: TryOnJob;
  onRetry: (job: TryOnJob) => void;
  isRetrying: boolean;
}

function TryOnHistoryResultCard({ job, onRetry, isRetrying }: TryOnHistoryResultCardProps) {
  return (
    <Card className="overflow-hidden">
      <ResolvedImage
        imageKey={job.status === "completed" ? job.result_image_key : job.garment_image_key}
        alt={`Try-on job ${job.id.slice(0, 8)}`}
        className="aspect-[3/4] w-full"
      />
      <CardContent className="flex items-center justify-between gap-2 p-4">
        <span className="truncate font-mono text-xs text-muted-foreground">
          Job {job.id.slice(0, 8)}
        </span>
        <StatusChip status={job.status} />
      </CardContent>
      <CardFooter className="justify-end gap-2 p-4 pt-0">
        {job.status === "failed" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onRetry(job)}
            isLoading={isRetrying}
          >
            <RotateCcw className="size-3.5" /> Retry
          </Button>
        )}
        {job.status === "completed" && (
          <Button asChild variant="outline" size="sm">
            <Link href="/shopper/tryon">View</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export { TryOnHistoryResultCard };
