import { useCallback, useRef, useState } from "react";

import { ApiError } from "@/api/client";
import { putFileToUploadUrl, requestUploadUrl, validateImageFile } from "@/api/shopper/upload";
import type { UploadStatus } from "@/types/shopper";

export interface UploadState {
  status: UploadStatus;
  objectKey: string | null;
  previewUrl: string | null;
  progress: number;
  error: string | null;
}

const IDLE_STATE: UploadState = {
  status: "idle",
  objectKey: null,
  previewUrl: null,
  progress: 0,
  error: null,
};

/**
 * Owns the full direct-upload orchestration described in backend
 * docs/STORAGE.md: 1) validate the file client-side, 2) request a
 * pre-signed URL via `POST /tryon/upload-url`, 3) PUT the file straight to
 * object storage, 4) hand the resulting `object_key` back to the caller.
 * `components/ui/file-dropzone.tsx` stays a "dumb" drag/drop shell by
 * design — this hook is the "feature-level hook" its own docstring calls
 * for. Shared across every upload surface (body profile reference photo,
 * wardrobe item image, try-on user/garment photos) since they all reuse
 * the same backend endpoint.
 *
 * `progress` is a placeholder — axios' `onUploadProgress` would give real
 * byte-level progress, but the PUT target is a pre-signed S3 URL reachable
 * directly from the browser, and progress is nice-to-have UI polish, not
 * function; wiring it up is a follow-up, not required for Phase 2.3.
 */
export function useUpload() {
  const [state, setState] = useState<UploadState>(IDLE_STATE);
  const previewUrlRef = useRef<string | null>(null);

  const upload = useCallback(async (file: File): Promise<string> => {
    const validation = validateImageFile(file);
    if (!validation.ok) {
      setState({ ...IDLE_STATE, status: "error", error: validation.error ?? "Invalid file." });
      throw new Error(validation.error);
    }

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;

    setState({ status: "uploading", objectKey: null, previewUrl, progress: 15, error: null });

    try {
      const { object_key: objectKey, upload_url: uploadUrl } = await requestUploadUrl({
        filename: file.name,
        content_type: file.type,
      });
      setState((prev) => ({ ...prev, progress: 60 }));

      await putFileToUploadUrl(uploadUrl, file);

      setState((prev) => ({ ...prev, status: "success", objectKey, progress: 100 }));
      return objectKey;
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Upload failed. Please try again.";
      setState((prev) => ({ ...prev, status: "error", error: message, progress: 0 }));
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setState(IDLE_STATE);
  }, []);

  return { ...state, upload, reset };
}
