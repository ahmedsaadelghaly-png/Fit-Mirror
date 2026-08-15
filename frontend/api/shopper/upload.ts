import axios from "axios";

import { apiClient } from "@/api/client";
import type { UploadUrlRequest, UploadUrlResponse } from "@/types/shopper";

/**
 * Requests a pre-signed upload target from the backend (see backend
 * docs/STORAGE.md) — shared by body-profile reference photos, try-on user
 * photos, try-on garment images, and wardrobe item images, all of which
 * reuse this single `/tryon/upload-url` endpoint (there is no per-resource
 * upload-url route on the backend today).
 */
export async function requestUploadUrl(payload: UploadUrlRequest): Promise<UploadUrlResponse> {
  const { data } = await apiClient.post<UploadUrlResponse>("/tryon/upload-url", null, {
    params: payload,
  });
  return data;
}

/**
 * PUTs the raw file bytes directly to the pre-signed S3 URL returned by
 * `requestUploadUrl`. Deliberately a plain `axios.put`, not `apiClient` —
 * this request goes straight to object storage, not the backend API, so it
 * must not carry the `Authorization` bearer header or hit `/api/v1`
 * interceptor logic (a 401 from S3 means something else entirely and
 * should never trigger a token refresh).
 */
export async function putFileToUploadUrl(uploadUrl: string, file: File): Promise<void> {
  await axios.put(uploadUrl, file, {
    headers: { "Content-Type": file.type },
  });
}

export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB, matches FileDropzone's stated hint
export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg"];

export interface ImageValidationResult {
  ok: boolean;
  error?: string;
}

/** Client-side file validation run before ever calling the upload-url endpoint. */
export function validateImageFile(file: File): ImageValidationResult {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, error: "Please choose a PNG or JPG image." };
  }
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return { ok: false, error: "Image is too large — please choose a file under 10MB." };
  }
  return { ok: true };
}
