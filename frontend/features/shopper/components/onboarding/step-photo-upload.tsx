"use client";

import { Button } from "@/components/ui/button";
import { useUpload } from "@/features/shopper/hooks/use-upload";
import { ImageUploadField } from "@/shared/components/image-upload-field";

export interface StepPhotoUploadProps {
  onContinue: () => void;
  onSkip: () => void;
}

/**
 * Uploads to storage via the shared pre-signed URL flow, but — see
 * types/shopper.ts `BodyProfileUpsertRequest` docstring — the backend's
 * `BodyProfileUpsert` schema has no field to persist the resulting
 * `object_key` to yet, so this step is upload-only guidance for now, not a
 * saved profile photo. That mismatch is called out in the UI copy below so
 * it isn't a silent gap.
 */
function StepPhotoUpload({ onContinue, onSkip }: StepPhotoUploadProps) {
  const upload = useUpload();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-xl font-semibold">Add a reference photo</h2>
        <p className="text-sm text-muted-foreground">
          A well-lit, front-facing photo against a plain background gives the best try-on results.
          Avoid heavy shadows or baggy clothing.
        </p>
      </div>

      <ImageUploadField
        label="Drop a reference photo here, or click to browse"
        hint="PNG or JPG, up to 10MB"
        status={upload.status}
        previewUrl={upload.previewUrl}
        progress={upload.progress}
        error={upload.error}
        onFileSelected={(file) => upload.upload(file).catch(() => undefined)}
        onClear={upload.reset}
      />

      <div className="flex gap-2">
        <Button type="button" onClick={onContinue} disabled={upload.status === "uploading"}>
          Continue
        </Button>
        <Button type="button" variant="ghost" onClick={onSkip}>
          Skip for now
        </Button>
      </div>
    </div>
  );
}

export { StepPhotoUpload };
