import { getAnalyticsAdapter } from "@/lib/analytics/adapter";
import type { AnalyticsProperties } from "@/lib/analytics/types";

/** Real call — routes through whichever adapter is active (see adapter.ts). Call from a route-change listener; not wired to one automatically to avoid a router-version-specific dependency. */
export function trackPageView(path: string, properties?: AnalyticsProperties): void {
  getAnalyticsAdapter().pageView(path, properties);
}

/** Real, generic event call — every helper below is a thin, typed wrapper over this. */
export function trackEvent(eventName: string, properties?: AnalyticsProperties): void {
  getAnalyticsAdapter().track(eventName, properties);
}

export function identifyUser(userId: string, properties?: AnalyticsProperties): void {
  getAnalyticsAdapter().identify(userId, properties);
}

export function resetAnalyticsIdentity(): void {
  getAnalyticsAdapter().reset();
}

/**
 * Try-on funnel — PLACEHOLDER event names/shapes, not yet called from
 * features/tryon/. Wire these into
 * features/tryon/components/tryon-workspace.tsx once product wants funnel
 * data; the shape here documents what that integration would look like.
 * See docs/frontend/ANALYTICS.md "Feature funnels".
 */
export const tryOnFunnel = {
  started: (properties?: AnalyticsProperties) => trackEvent("tryon_started", properties),
  photosUploaded: (properties?: AnalyticsProperties) =>
    trackEvent("tryon_photos_uploaded", properties),
  jobCreated: (jobId: string, properties?: AnalyticsProperties) =>
    trackEvent("tryon_job_created", { job_id: jobId, ...properties }),
  jobCompleted: (jobId: string, properties?: AnalyticsProperties) =>
    trackEvent("tryon_job_completed", { job_id: jobId, ...properties }),
  jobFailed: (jobId: string, properties?: AnalyticsProperties) =>
    trackEvent("tryon_job_failed", { job_id: jobId, ...properties }),
  lookSaved: (properties?: AnalyticsProperties) => trackEvent("tryon_look_saved", properties),
};

/** Brand product funnel — PLACEHOLDER, not yet called from features/brand/. */
export const brandProductFunnel = {
  productFormOpened: (mode: "create" | "edit", properties?: AnalyticsProperties) =>
    trackEvent("brand_product_form_opened", { mode, ...properties }),
  productCreated: (productId: string, properties?: AnalyticsProperties) =>
    trackEvent("brand_product_created", { product_id: productId, ...properties }),
  variantAdded: (productId: string, properties?: AnalyticsProperties) =>
    trackEvent("brand_variant_added", { product_id: productId, ...properties }),
};

/** Admin action events — PLACEHOLDER, not yet called from features/admin/. */
export const adminActionEvents = {
  userRoleChanged: (userId: string, properties?: AnalyticsProperties) =>
    trackEvent("admin_user_role_changed", { user_id: userId, ...properties }),
  storeVerified: (storeId: string, properties?: AnalyticsProperties) =>
    trackEvent("admin_store_verified", { store_id: storeId, ...properties }),
  productFlagged: (productId: string, properties?: AnalyticsProperties) =>
    trackEvent("admin_product_flagged", { product_id: productId, ...properties }),
  featureFlagToggled: (flagKey: string, enabled: boolean, properties?: AnalyticsProperties) =>
    trackEvent("admin_feature_flag_toggled", { flag_key: flagKey, enabled, ...properties }),
};
