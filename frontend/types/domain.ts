/**
 * Domain types mirroring the backend's Pydantic response schemas.
 * Kept in sync manually today — see docs/frontend/FRONTEND_ARCHITECTURE.md
 * "Planned: typed API client generation" for the long-term plan to
 * generate these from the backend's OpenAPI schema instead.
 */

export type UserRole = "shopper" | "brand_admin" | "platform_admin";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
}

export type BodyCategory = "women" | "men" | "girls" | "boys";

export type ProductAudience = BodyCategory | "unisex";

export interface BodyProfile {
  id: string;
  body_category: BodyCategory | null;
  height_cm: number | null;
  weight_kg: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  body_shape: string | null;
  reference_image_key: string | null;
}

export type WardrobeItemSource = "uploaded" | "catalog";

export interface WardrobeItem {
  id: string;
  source: WardrobeItemSource;
  category: string;
  label: string | null;
  image_key: string;
}

export type TryOnJobStatus = "pending" | "processing" | "completed" | "failed";

export interface TryOnJob {
  id: string;
  status: TryOnJobStatus;
  user_image_key: string;
  garment_image_key: string;
  result_image_key: string | null;
  ai_model_name: string | null;
  error_message: string | null;
}

export interface ProductVariant {
  id: string;
  size_label: string;
  color: string | null;
  sku: string;
  stock_quantity: number;
  garment_image_key: string | null;
}

export interface Product {
  id: string;
  title: string;
  description: string | null;
  category: string;
  audience: ProductAudience;
  price: string;
  currency: string;
  primary_image_key: string | null;
  is_active: boolean;
  is_archived: boolean;
  variants: ProductVariant[];
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  logo_image_key: string | null;
  is_verified: boolean;
}

export interface StoreDashboardSummary {
  total_products: number;
  total_tryon_jobs: number;
  completed_tryon_jobs: number;
  failed_tryon_jobs: number;
}

export interface DownloadUrlResponse {
  download_url: string;
}
