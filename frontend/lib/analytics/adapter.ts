import { env } from "@/config/env";
import { logger } from "@/lib/monitoring/logger";
import type { AnalyticsAdapter, AnalyticsProperties } from "@/lib/analytics/types";

/** Safe default for any environment without a real vendor configured — every call is a real no-op, not a stub that throws. */
export const noopAnalyticsAdapter: AnalyticsAdapter = {
  name: "noop",
  pageView: () => undefined,
  track: () => undefined,
  identify: () => undefined,
  reset: () => undefined,
};

/** Used in development so engineers can see what *would* be sent, without standing up a real analytics account. */
export const consoleAnalyticsAdapter: AnalyticsAdapter = {
  name: "console",
  pageView: (path, properties) => logger.debug(`analytics.pageView: ${path}`, properties),
  track: (eventName, properties) => logger.debug(`analytics.track: ${eventName}`, properties),
  identify: (userId, properties) => logger.debug(`analytics.identify: ${userId}`, properties),
  reset: () => logger.debug("analytics.reset"),
};

let activeAdapter: AnalyticsAdapter | null = null;

/**
 * Returns the process-wide analytics adapter, chosen once and cached.
 * Defaults to `console` in development (visible, harmless) and `noop` in
 * production (silent until a real vendor adapter is registered via
 * `setAnalyticsAdapter`) — see docs/frontend/ANALYTICS.md for how to wire
 * a real vendor in without touching any call site.
 */
export function getAnalyticsAdapter(): AnalyticsAdapter {
  if (!activeAdapter) {
    activeAdapter =
      env.NEXT_PUBLIC_APP_ENV === "development" ? consoleAnalyticsAdapter : noopAnalyticsAdapter;
  }
  return activeAdapter;
}

/** Swaps in a real adapter (e.g. a PostHog/Segment/GA wrapper implementing `AnalyticsAdapter`) — call once, at app startup. */
export function setAnalyticsAdapter(adapter: AnalyticsAdapter): void {
  activeAdapter = adapter;
}

export type { AnalyticsAdapter, AnalyticsProperties };
