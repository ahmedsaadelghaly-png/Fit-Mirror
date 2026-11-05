import type { Product, ProductAudience, StoreSocialLinks } from "@/types/domain";

/**
 * Request/response shapes for the Brand/Store feature area — see backend
 * docs/API_CONTRACTS.md "Store Dashboard". Several Phase 2.4 spec fields
 * have NO backend support at all (confirmed by reading
 * backend/app/schemas/store.py and backend/app/schemas/product.py — not
 * just unimplemented, the fields don't exist on the models); those are
 * captured in the frontend-only types below and documented in
 * docs/frontend/BRAND_APP.md "API contract mismatches".
 */

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

/** Mirrors the backend's `StoreCreate` exactly — name + slug, nothing else. */
export interface StoreCreateRequest {
  name: string;
  slug: string;
}

/**
 * The editable business info on a store — `PATCH /store/me`. The logo
 * must be an image this account uploaded (backend checks the object key).
 */
export interface StoreBusinessInfo {
  category: string | null;
  description: string | null;
  social_links: StoreSocialLinks;
  logo_image_key: string | null;
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

/** Mirrors the backend's `ProductCreate` exactly — no `is_active`, no `variants`. */
export interface ProductCreateRequest {
  title: string;
  description?: string | null;
  category: string;
  audience?: ProductAudience;
  price: string;
  currency: string;
  primary_image_key?: string | null;
}

export interface ProductFilters {
  category: string | "all";
  /** "all" excludes archived items, same as a typical catalog view — "archived" is its own explicit filter so archived products stay reachable (e.g. to unarchive). */
  status: "all" | "active" | "inactive" | "archived";
  search: string;
}

/** `PATCH /store/products/{id}` body — only the fields present change. */
export type ProductUpdateRequest = Partial<
  Pick<
    Product,
    | "title"
    | "description"
    | "category"
    | "audience"
    | "price"
    | "currency"
    | "primary_image_key"
    | "is_active"
    | "is_archived"
  >
>;

export interface VariantFormInput {
  size_label: string;
  color?: string | null;
  sku: string;
  stock_quantity: number;
  garment_image_key?: string | null;
}

/** What every product-list/detail view renders — see features/brand/lib/resolve-product.ts. */
export interface ResolvedProduct extends Product {
  isArchived: boolean;
}

// ---------------------------------------------------------------------------
// Size charts (Phase 4) — `GET/PUT/DELETE /store/size-charts[/{category}]`
// ---------------------------------------------------------------------------

/** Measurements in cm as [min, max]; any subset per row, smallest size first. */
export interface SizeChartRow {
  size_label: string;
  chest_cm?: [number, number] | null;
  waist_cm?: [number, number] | null;
  hip_cm?: [number, number] | null;
  height_cm?: [number, number] | null;
}

export interface SizeChart {
  category: string;
  rows: SizeChartRow[];
  updated_at: string;
}

export interface StoreAnalytics {
  days: number;
  tryons: number;
  shoppers: number;
  completed: number;
  saved_looks: number;
  top_products: { product_id: string; title: string; tryons: number; shoppers: number }[];
  size_demand: { size_label: string; tryons: number }[];
  fit_counts: Record<"small" | "true_to_size" | "large", number>;
}
