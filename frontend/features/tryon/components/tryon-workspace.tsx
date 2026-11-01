"use client";

import { Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { useSaveLook } from "@/features/shopper/hooks/use-save-look";
import { useSavedLooks } from "@/features/shopper/hooks/use-saved-looks";
import { useUpload } from "@/features/shopper/hooks/use-upload";
import { GarmentPanel } from "@/features/tryon/components/garment-panel";
import { QueueStatusCard } from "@/features/tryon/components/queue-status-card";
import { ResultPanel } from "@/features/tryon/components/result-panel";
import { TryOnHistorySidebar } from "@/features/tryon/components/tryon-history-sidebar";
import { UserPhotoPanel } from "@/features/tryon/components/user-photo-panel";
import { useCreateTryOnJob } from "@/features/tryon/hooks/use-create-tryon-job";
import { useTryOnJob } from "@/features/tryon/hooks/use-tryon-job";
import { useTryOnJobs } from "@/features/tryon/hooks/use-tryon-jobs";
import { retryPayload } from "@/features/tryon/lib/job-display";
import type { TryOnJob } from "@/types/domain";

/**
 * The flagship Virtual Try-On workspace: split layout (user photo /
 * garment / result), job creation, status polling, and history — see
 * docs/frontend/SHOPPER_APP.md "Virtual Try-On" for the full flow this
 * implements against `POST /tryon/upload-url`, `POST /tryon`,
 * `GET /tryon/{job_id}`, `GET /tryon`.
 */
function TryOnWorkspace() {
  const userUpload = useUpload();
  const garmentUpload = useUpload();
  // `?job=<id>` — arriving from a catalog try-on or a history card.
  const searchParams = useSearchParams();
  const [activeJobId, setActiveJobId] = useState<string | null>(searchParams.get("job"));

  const createJobMutation = useCreateTryOnJob();
  const activeJobQuery = useTryOnJob(activeJobId);
  const { jobs, isLoading: isHistoryLoading } = useTryOnJobs();
  const savedLooksQuery = useSavedLooks();
  const saveLookMutation = useSaveLook();

  const activeJob = activeJobQuery.data;
  const activeJobs = jobs.filter((job) => job.status === "pending" || job.status === "processing");
  const isLookSaved = !!(
    activeJob && savedLooksQuery.data?.some((look) => look.tryon_job_id === activeJob.id)
  );

  const canCreateJob = !!userUpload.objectKey && !!garmentUpload.objectKey;

  const createJob = async (userImageKey: string, garmentImageKey: string) => {
    const accepted = await createJobMutation.mutateAsync({
      user_image_key: userImageKey,
      garment_image_key: garmentImageKey,
    });
    setActiveJobId(accepted.job_id);
  };

  const handleCreate = () => {
    if (!userUpload.objectKey || !garmentUpload.objectKey) return;
    createJob(userUpload.objectKey, garmentUpload.objectKey).catch(() => undefined);
  };

  const handleRetry = (job?: TryOnJob) => {
    const target = job ?? activeJob;
    if (!target) return;
    createJobMutation
      .mutateAsync(retryPayload(target))
      .then((accepted) => setActiveJobId(accepted.job_id))
      .catch(() => undefined);
  };

  const handleSaveLook = () => {
    if (!activeJob || activeJob.status !== "completed" || !activeJob.result_image_key) return;
    saveLookMutation.mutate({ tryon_job_id: activeJob.id });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Virtual try-on</h1>
          <p className="text-sm text-muted-foreground">
            Upload your photo and a garment to see how it looks on you.
          </p>
        </div>
        <Button
          type="button"
          onClick={handleCreate}
          disabled={!canCreateJob}
          isLoading={createJobMutation.isPending}
        >
          <Sparkles className="size-4" /> Create try-on
        </Button>
      </div>

      {createJobMutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          {createJobMutation.error instanceof ApiError
            ? createJobMutation.error.message
            : "Something went wrong creating your try-on. Please try again."}
        </p>
      )}

      {/*
        The result is the payoff of the whole workspace, so it gets the
        dominant column — inputs (compact, stacked) on the left, result
        (wide) in the center, queue/history on the right. Purely a layout
        change: every handler/prop below is identical to before.
      */}
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1.6fr)_320px]">
        <div className="flex flex-col gap-4">
          <UserPhotoPanel upload={userUpload} disabled={createJobMutation.isPending} />
          <GarmentPanel upload={garmentUpload} disabled={createJobMutation.isPending} />
        </div>

        <ResultPanel
          job={activeJob}
          onRetry={() => handleRetry()}
          isRetrying={createJobMutation.isPending}
          onSaveLook={handleSaveLook}
          isSavingLook={saveLookMutation.isPending}
          isLookSaved={isLookSaved}
        />

        <div className="flex flex-col gap-4">
          <QueueStatusCard activeJobs={activeJobs} />
          <TryOnHistorySidebar
            jobs={jobs}
            isLoading={isHistoryLoading}
            activeJobId={activeJobId}
            onSelect={(job) => setActiveJobId(job.id)}
            onRetry={handleRetry}
          />
        </div>
      </div>
    </div>
  );
}

export { TryOnWorkspace };
