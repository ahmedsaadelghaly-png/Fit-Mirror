"use client";

import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { UploadStatus } from "@/types/shopper";

export interface ImageUploadFieldProps {
  label: string;
  hint?: string;
  status: UploadStatus;
  previewUrl: string | null;
  progress: number;
  error?: string | null;
  onFileSelected: (file: File) => void;
  onClear?: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Reusable drag-and-drop image upload field — wraps the dumb
 * `components/ui/file-dropzone.tsx` primitive with the preview, progress,
 * and success/error states every upload surface in Phase 2.3 needs (body
 * profile reference photo, wardrobe item image, try-on user/garment
 * photos). Business logic (the actual pre-signed-URL upload) lives in
 * features/shopper/hooks/use-upload.ts — this component only renders
 * whatever state that hook produces.
 */
function ImageUploadField({
  label,
  hint,
  status,
  previewUrl,
  progress,
  error,
  onFileSelected,
  onClear,
  disabled,
  className,
}: ImageUploadFieldProps) {
  const handleFiles = (files: FileList) => {
    const file = files[0];
    if (file) onFileSelected(file);
  };

  if (previewUrl) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <div className="relative aspect-[3/4] w-full max-w-64 overflow-hidden rounded-lg border bg-muted">
          {/* A plain <img>, not next/image: `previewUrl` is always a local
              blob: object URL from URL.createObjectURL (see features/
              shopper/hooks/use-upload.ts), never a remote asset — Next's
              image optimizer has nothing to do here, and staying framework-
              agnostic keeps this component Storybook-safe (see
              docs/frontend/STORYBOOK.md on next/image not being resolvable
              under the Vite-based story runner). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt={`${label} preview`} className="size-full object-cover" />
          {status === "uploading" && (
            <div className="absolute inset-x-0 bottom-0 bg-surface/90 p-2">
              <Progress value={progress} aria-label="Upload progress" />
            </div>
          )}
          {status === "success" && (
            <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-success/90 text-success-foreground">
              <CheckCircle2 className="size-4" aria-hidden="true" />
            </span>
          )}
          {status === "error" && (
            <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-destructive/90 text-destructive-foreground">
              <XCircle className="size-4" aria-hidden="true" />
            </span>
          )}
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {onClear && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClear}
            disabled={disabled}
            className="w-fit"
          >
            <RotateCcw className="size-3.5" /> Replace photo
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <FileDropzone
        label={label}
        hint={hint}
        onFilesSelected={handleFiles}
        disabled={disabled || status === "uploading"}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export { ImageUploadField };
