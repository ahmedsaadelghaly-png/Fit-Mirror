"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { cn } from "@/lib/utils";
import { ResolvedImage } from "@/shared/components/resolved-image";
import type { TryOnJob } from "@/types/domain";

export interface TryOnJobCardProps {
  job: TryOnJob;
  isActive?: boolean;
  onSelect?: (job: TryOnJob) => void;
  onRetry?: (job: TryOnJob) => void;
}

function TryOnJobCard({ job, isActive, onSelect, onRetry }: TryOnJobCardProps) {
  return (
    <div
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={() => onSelect?.(job)}
      onKeyDown={(event) => {
        if (onSelect && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onSelect(job);
        }
      }}
      className={cn(
        "flex items-center gap-3 rounded-lg border p-2 transition-colors",
        onSelect && "cursor-pointer hover:bg-accent/50",
        isActive && "border-primary bg-accent/40",
      )}
    >
      <ResolvedImage
        imageKey={job.result_image_key ?? job.garment_image_key}
        alt={`Try-on job ${job.id.slice(0, 8)}`}
        className="size-12 shrink-0 rounded-md"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate font-mono text-xs text-muted-foreground">
          Job {job.id.slice(0, 8)}
        </span>
        <StatusChip status={job.status} />
      </div>
      {job.status === "failed" && onRetry && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Retry this try-on"
          onClick={(event) => {
            event.stopPropagation();
            onRetry(job);
          }}
        >
          <RotateCcw className="size-4" />
        </Button>
      )}
    </div>
  );
}

export { TryOnJobCard };
