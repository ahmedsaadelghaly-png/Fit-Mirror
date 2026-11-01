import type { TryOnJobStatus, UserRole } from "@/types/domain";

/**
 * Request/response and mock-data shapes for the Platform Admin feature
 * area. Since Phase 3.1, users, stores, and try-on jobs come from the real
 * `/admin/*` API (see api/admin/{users,stores,tryon-jobs}.ts and
 * docs/API_CONTRACTS.md "Platform Admin"). Everything else — product
 * moderation, queue/workers, audit log, feature flags, reports, alerts —
 * still has no backend and is generated in api/admin/mock-data.ts; every
 * view of it shows a visible "Mocked data" label.
 */

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface AdminUserRow {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface AdminUserFilters {
  role: UserRole | "all";
  status: "all" | "active" | "inactive";
  search: string;
}

// ---------------------------------------------------------------------------
// Stores
// ---------------------------------------------------------------------------

export interface AdminStoreRow {
  id: string;
  name: string;
  slug: string;
  owner_email: string;
  is_verified: boolean;
  is_suspended: boolean;
  product_count: number;
  created_at: string;
}

export interface AdminStoreFilters {
  verification: "all" | "verified" | "unverified";
  search: string;
}

// ---------------------------------------------------------------------------
// Products (platform-wide monitoring view — distinct from Brand's own
// GET /store/products, which only ever sees one store's catalog)
// ---------------------------------------------------------------------------

export interface AdminProductRow {
  id: string;
  title: string;
  store_name: string;
  category: string;
  price: string;
  currency: string;
  is_active: boolean;
  primary_image_key: string | null;
  created_at: string;
}

export interface AdminProductFilters {
  store: string | "all";
  category: string | "all";
  status: "all" | "active" | "inactive" | "flagged" | "hidden";
  search: string;
}

/** Local-only overlay — no moderation endpoint exists (flag/hide/image review). */
export interface ProductModerationOverlay {
  productId: string;
  isFlagged: boolean;
  isHidden: boolean;
}

// ---------------------------------------------------------------------------
// Try-on jobs (platform-wide monitoring view — distinct from Shopper's own
// GET /tryon, which only ever sees one user's jobs)
// ---------------------------------------------------------------------------

export interface AdminTryOnJobRow {
  id: string;
  status: TryOnJobStatus;
  user_email: string;
  /** Only set for catalog-garment jobs; uploaded garments have no store. */
  store_name: string | null;
  user_image_key: string;
  garment_image_key: string;
  result_image_key: string | null;
  ai_model_name: string | null;
  error_message: string | null;
  created_at: string;
}

export interface AdminTryOnJobFilters {
  status: TryOnJobStatus | "all";
  search: string;
}

// ---------------------------------------------------------------------------
// Queue & workers (mock — no Celery monitoring endpoint exists at all)
// ---------------------------------------------------------------------------

export interface QueueStats {
  queueName: string;
  pending: number;
  processing: number;
  failed: number;
  throughputPerMinute: number;
}

export type WorkerState = "online" | "offline" | "degraded";

export interface WorkerStatusRow {
  id: string;
  hostname: string;
  state: WorkerState;
  activeTasks: number;
  concurrency: number;
  lastHeartbeatAt: string;
}

// ---------------------------------------------------------------------------
// AI services (mock — no proxy to the AI service's health check exists)
// ---------------------------------------------------------------------------

export type ServiceStatus = "healthy" | "degraded" | "down" | "unknown";

export interface AiServiceHealth {
  status: ServiceStatus;
  activeModel: string;
  modelVersion: string;
  gpuStatus: string;
  inferenceLatencyMsP50: number;
  inferenceLatencyMsP95: number;
  errorRatePercent: number;
  failedInferenceJobs24h: number;
}

// ---------------------------------------------------------------------------
// System health — one real check (backend), the rest mocked
// ---------------------------------------------------------------------------

export interface SystemHealthCheck {
  service: string;
  status: ServiceStatus;
  detail: string;
  isMocked: boolean;
}

// ---------------------------------------------------------------------------
// Audit logs (mock — no AuditLog model/table/endpoint exists at all)
// ---------------------------------------------------------------------------

export type AuditEventType =
  | "user.login"
  | "user.role_changed"
  | "user.deactivated"
  | "store.verified"
  | "store.suspended"
  | "product.flagged"
  | "tryon.job_failed"
  | "feature_flag.toggled";

export interface AuditLogEntry {
  id: string;
  event_type: AuditEventType;
  actor_email: string;
  target: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export interface AuditLogFilters {
  eventType: AuditEventType | "all";
  search: string;
}

// ---------------------------------------------------------------------------
// Feature flags (mock — no feature-flag model/endpoint exists at all)
// ---------------------------------------------------------------------------

export const FEATURE_FLAG_KEYS = [
  "ai_stylist_enabled",
  "shopping_assistant_enabled",
  "real_tryon_model_enabled",
  "store_dashboard_beta_enabled",
  "social_sharing_enabled",
  "admin_advanced_monitoring_enabled",
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];

export type FeatureFlagEnvironment = "all" | "development" | "staging" | "production";

export interface FeatureFlag {
  key: FeatureFlagKey;
  label: string;
  description: string;
  enabled: boolean;
  environment: FeatureFlagEnvironment;
  rolloutPercentage: number;
}

// ---------------------------------------------------------------------------
// Reports (mock — no analytics/reporting endpoint exists at all)
// ---------------------------------------------------------------------------

export interface TimeSeriesPoint {
  label: string;
  value: number;
}

export interface PlatformReports {
  userGrowth: TimeSeriesPoint[];
  storeGrowth: TimeSeriesPoint[];
  tryOnUsage: TimeSeriesPoint[];
  failedJobs: TimeSeriesPoint[];
}

// ---------------------------------------------------------------------------
// Dashboard alerts (mock)
// ---------------------------------------------------------------------------

export type AlertSeverity = "info" | "warning" | "critical";

export interface AdminAlert {
  id: string;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
}
