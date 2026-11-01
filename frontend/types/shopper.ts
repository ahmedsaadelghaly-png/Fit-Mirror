import type { TryOnJobStatus, WardrobeItemSource } from "@/types/domain";

/**
 * Request/response shapes for the Shopper feature area (body profile,
 * wardrobe, try-on, saved looks) — see backend docs/API_CONTRACTS.md
 * "Users", "Smart Wardrobe", "Virtual Try-On".
 */

// ---------------------------------------------------------------------------
// Body profile
// ---------------------------------------------------------------------------

/**
 * Mirrors the backend's `BodyProfileUpsert` schema exactly — all fields
 * optional, no min/max validation server-side (see backend
 * app/schemas/user.py). Zod validation in features/shopper/schemas.ts adds
 * sane client-side bounds on top since the backend doesn't enforce any.
 *
 * KNOWN CONTRACT MISMATCH: the product spec for Phase 2.3 asks for
 * `preferred_fit`, `favorite_colors`, and `style_preferences` on the body
 * profile, but the backend's `BodyProfileUpsert` has no such fields (see
 * docs/frontend/SHOPPER_APP.md "API contract mismatches"). Those three are
 * captured client-side only, in `StylePreferences` below, persisted to
 * localStorage via features/shopper/hooks/use-style-preferences.ts.
 */
export interface BodyProfileUpsertRequest {
  height_cm?: number | null;
  weight_kg?: number | null;
  chest_cm?: number | null;
  waist_cm?: number | null;
  hip_cm?: number | null;
  body_shape?: string | null;
}

/**
 * Frontend-only extension of the body profile — the backend has no
 * endpoint for these fields (see the mismatch note above). Persisted to
 * localStorage, keyed per user, so it survives a refresh but is not part
 * of any server-side record yet.
 */
export interface StylePreferences {
  preferred_fit: string | null;
  favorite_colors: string[];
  style_preferences: string[];
}

// ---------------------------------------------------------------------------
// Uploads (shared pre-signed URL flow — see backend docs/STORAGE.md)
// ---------------------------------------------------------------------------

export interface UploadUrlRequest {
  filename: string;
  content_type: string;
}

export interface UploadUrlResponse {
  object_key: string;
  upload_url: string;
  expires_in_seconds: number;
}

export type UploadStatus = "idle" | "uploading" | "success" | "error";

// ---------------------------------------------------------------------------
// Wardrobe
// ---------------------------------------------------------------------------

export interface WardrobeItemCreateRequest {
  source: WardrobeItemSource;
  category: string;
  label?: string | null;
  image_key: string;
  product_variant_id?: string | null;
}

/**
 * KNOWN CONTRACT MISMATCH: the product spec asks for a "color" filter on
 * wardrobe items, but `WardrobeItemRead` has no `color` field and
 * `GET /wardrobe` accepts no query params at all (see
 * docs/frontend/SHOPPER_APP.md). Category/source filtering below is
 * therefore applied client-side against the full list `GET /wardrobe`
 * already returns; "color" is dropped as a filter dimension until the
 * backend adds the field.
 */
export interface WardrobeFilters {
  category: string | "all";
  source: WardrobeItemSource | "all";
  search: string;
}

// ---------------------------------------------------------------------------
// Virtual Try-On
// ---------------------------------------------------------------------------

export interface TryOnCreateRequest {
  user_image_key: string;
  garment_image_key?: string | null;
  product_variant_id?: string | null;
}

export interface TryOnJobAccepted {
  job_id: string;
  status: TryOnJobStatus;
}

export interface TryOnHistoryFilters {
  status: TryOnJobStatus | "all";
  search: string;
}

// ---------------------------------------------------------------------------
// Saved Looks — NO backend endpoint exists yet (confirmed absent across
// routers/schemas/models). Built as a frontend-only, localStorage-backed
// placeholder per the Phase 2.3 spec ("This can be frontend placeholder if
// backend endpoint is not ready") — see api/shopper/saved-looks.ts and
// docs/frontend/SHOPPER_APP.md for the documented mismatch and the shape a
// real `POST /saved-looks` would presumably take.
// ---------------------------------------------------------------------------

export interface SavedLook {
  id: string;
  tryon_job_id: string;
  result_image_key: string;
  garment_image_key: string;
  label: string | null;
  created_at: string;
}

export interface SavedLookCreateInput {
  tryon_job_id: string;
  result_image_key: string;
  garment_image_key: string;
  label?: string | null;
}

// ---------------------------------------------------------------------------
// AI Stylist / Shopping Assistant / Size Recommendation — rule-based v1
// backends (see docs/API_CONTRACTS.md "AI Stylist, Size Recommendation,
// Shopping Assistant").
// ---------------------------------------------------------------------------

export interface StylistSuggestionRequest {
  occasion?: string;
  weather?: string;
}

export interface StylistSuggestionResponse {
  suggestion_id: string;
  wardrobe_item_ids: string[];
  rationale: string;
}

export interface ShoppingAskRequest {
  query: string;
}

export interface ShoppingAskResponse {
  matched_product_ids: string[];
  reply: string;
}

/** `POST /sizing/recommend` — see backend app/services/sizing_service.py. */
export interface SizeRecommendation {
  product_id: string;
  recommended_size_label: string;
  /** 0.3–0.95; lower when measurements span sizes or the exact size isn't stocked. */
  confidence: number;
  fit_note: string;
}

// ---------------------------------------------------------------------------
// Onboarding — entirely frontend-local state, no backend resource.
// ---------------------------------------------------------------------------

export type OnboardingStepId = "style" | "body-profile" | "photo" | "complete";

export interface OnboardingState {
  completedSteps: OnboardingStepId[];
  currentStep: OnboardingStepId;
  isComplete: boolean;
}
