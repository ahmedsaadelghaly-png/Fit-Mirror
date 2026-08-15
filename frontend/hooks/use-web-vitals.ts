"use client";

import { useReportWebVitals } from "next/web-vitals";

import { trackEvent } from "@/lib/analytics";
import { logger } from "@/lib/monitoring/logger";

/**
 * Wraps Next.js's built-in `useReportWebVitals` (Core Web Vitals: CLS,
 * FCP, INP, LCP, TTFB) — logs every metric locally and forwards it to the
 * analytics adapter as a `web_vitals` event, so whichever adapter is
 * configured (see lib/analytics/adapter.ts) receives real field data, not
 * just synthetic lab data from Lighthouse. Mount this once, in
 * providers/app-providers.tsx. See docs/frontend/PERFORMANCE.md
 * "Web vitals reporting".
 */
export function useWebVitals(): void {
  useReportWebVitals((metric) => {
    logger.debug(`web-vital: ${metric.name}`, {
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
    });
    trackEvent("web_vitals", {
      metric_name: metric.name,
      value: metric.value,
      rating: metric.rating,
    });
  });
}
