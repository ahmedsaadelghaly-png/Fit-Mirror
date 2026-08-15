"use client";

import { Bookmark, Download, RotateCcw, Share2, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusChip } from "@/components/ui/status-chip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResolvedImage } from "@/shared/components/resolved-image";
import type { TryOnJob } from "@/types/domain";

export interface ResultPanelProps {
  job: TryOnJob | undefined;
  onRetry: () => void;
  isRetrying: boolean;
  onSaveLook: () => void;
  isSavingLook: boolean;
  isLookSaved: boolean;
}

function IdleState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
      <Sparkles className="size-8" aria-hidden="true" />
      <p className="max-w-52 text-sm">
        Upload your photo and a garment, then create a try-on to see the result here.
      </p>
    </div>
  );
}

/**
 * Renders every state a try-on job can be in: no job yet, pending/
 * processing (queued), completed (result + before/after comparison
 * placeholder + save/download/share actions), and failed (retry). Job
 * status comes from features/tryon/hooks/use-tryon-job.ts, which polls
 * `GET /tryon/{job_id}` until it reaches a terminal state.
 */
function ResultPanel({
  job,
  onRetry,
  isRetrying,
  onSaveLook,
  isSavingLook,
  isLookSaved,
}: ResultPanelProps) {
  const [compareView, setCompareView] = useState<"result" | "before-after">("result");

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Result</CardTitle>
          <CardDescription>Your generated try-on</CardDescription>
        </div>
        {job && <StatusChip status={job.status} />}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {!job && <IdleState />}

        {job && (job.status === "pending" || job.status === "processing") && (
          <LoadingState
            label={job.status === "pending" ? "Queued — starting soon…" : "Generating your try-on…"}
          />
        )}

        {job && job.status === "failed" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
            <p className="text-sm text-destructive">
              {job.error_message ?? "This try-on couldn't be completed. Please try again."}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRetry}
              isLoading={isRetrying}
            >
              <RotateCcw className="size-3.5" /> Retry
            </Button>
          </div>
        )}

        {job && job.status === "completed" && (
          <>
            <Tabs
              value={compareView}
              onValueChange={(value) => setCompareView(value as "result" | "before-after")}
            >
              <TabsList>
                <TabsTrigger value="result">Result</TabsTrigger>
                <TabsTrigger value="before-after">Before / after</TabsTrigger>
              </TabsList>
            </Tabs>

            {compareView === "result" ? (
              <ResolvedImage
                imageKey={job.result_image_key}
                alt="Try-on result"
                className="aspect-[3/4] w-full rounded-lg"
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-center text-xs text-muted-foreground">Before</span>
                  <ResolvedImage
                    imageKey={job.user_image_key}
                    alt="Before"
                    className="aspect-[3/4] w-full rounded-lg"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-center text-xs text-muted-foreground">After</span>
                  <ResolvedImage
                    imageKey={job.result_image_key}
                    alt="After"
                    className="aspect-[3/4] w-full rounded-lg"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={onSaveLook}
                isLoading={isSavingLook}
                disabled={isLookSaved}
              >
                <Bookmark className="size-3.5" /> {isLookSaved ? "Saved" : "Save look"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled
                title="Download is coming soon"
              >
                <Download className="size-3.5" /> Download
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled
                title="Sharing is coming soon"
              >
                <Share2 className="size-3.5" /> Share
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRetry}
                isLoading={isRetrying}
              >
                <RotateCcw className="size-3.5" /> Try again
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export { ResultPanel };
