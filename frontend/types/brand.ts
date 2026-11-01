import type { Product } from "@/types/domain";

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
 * KNOWN CONTRACT MISMATCH: there is no `PUT/PATCH /store` or `/store/me` —
 * store updates of any kind are unsupported server-side. `description`,
 * `category`, and `social_links` also don't exist on the `Store` model at
 * all (not even read-only). Captured here as frontend-only state,
 * persisted to localStorage via
 * features/brand/hooks/use-store-business-info.ts.
 */
export interface StoreBusinessInfo {
  category: string | null;
  description: string | null;
  social_links: {
    website: string | null;
    instagram: string | null;
    tiktok: string | null;
  };
  /**
   * An uploaded logo's storage key. `StoreRead.logo_image_key` exists as a
   * read-only field, but nothing can ever set it (no store-update
   * endpoint) — this is a local shadow of "the logo this brand admin
   * uploaded," not the server's `logo_image_key` (which stays `null`
   * forever via the API today).
   */
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
