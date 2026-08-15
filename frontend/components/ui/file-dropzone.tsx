"use client";

import { UploadCloud } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export interface FileDropzoneProps {
  label?: string;
  hint?: string;
  accept?: string;
  onFilesSelected?: (files: FileList) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * PLACEHOLDER file dropzone.
 *
 * Phase 2.1 scope: the visual/interaction shell (drag-over state, click to
 * browse, keyboard-accessible) with no real upload logic wired in yet.
 * Planned (once Try-On/Wardrobe pages are built): call
 * `POST /tryon/upload-url` (see backend docs/STORAGE.md) to get a
 * pre-signed URL, PUT the file there directly, then hand the resulting
 * object_key to the parent via a form field — this component should stay
 * "dumb" (emits raw FileList via onFilesSelected) and let a feature-level
 * hook own the upload orchestration.
 */
function FileDropzone({
  label = "Drop an image here, or click to browse",
  hint = "PNG or JPG, up to 10MB",
  accept = "image/png,image/jpeg",
  onFilesSelected,
  className,
  disabled,
}: FileDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = React.useState(false);

  const handleFiles = (files: FileList | null) => {
    if (files && files.length > 0) {
      onFilesSelected?.(files);
    }
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(event) => {
        if (!disabled && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setIsDragActive(true);
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragActive(false);
        if (!disabled) handleFiles(event.dataTransfer.files);
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-border hover:border-muted-foreground/50",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      <UploadCloud className="size-8 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => handleFiles(event.target.files)}
      />
    </div>
  );
}

export { FileDropzone };
