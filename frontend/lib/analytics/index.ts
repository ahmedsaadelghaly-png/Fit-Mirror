export {
  consoleAnalyticsAdapter,
  getAnalyticsAdapter,
  noopAnalyticsAdapter,
  setAnalyticsAdapter,
} from "@/lib/analytics/adapter";
export {
  adminActionEvents,
  brandProductFunnel,
  identifyUser,
  resetAnalyticsIdentity,
  trackEvent,
  trackPageView,
  tryOnFunnel,
} from "@/lib/analytics/events";
export type { AnalyticsAdapter, AnalyticsProperties } from "@/lib/analytics/types";
