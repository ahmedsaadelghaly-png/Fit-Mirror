/**
 * Vendor-agnostic analytics contract — every adapter (console, a real
 * vendor SDK later) implements this interface. See
 * docs/frontend/ANALYTICS.md "Adapter pattern" and the Phase 2.6 rule:
 * "Do NOT hardcode a vendor. Use an adapter pattern."
 */
export interface AnalyticsProperties {
  [key: string]: string | number | boolean | null | undefined;
}

export interface AnalyticsAdapter {
  /** Human-readable adapter name, surfaced in docs/debugging, never sent anywhere. */
  readonly name: string;
  pageView(path: string, properties?: AnalyticsProperties): void;
  track(eventName: string, properties?: AnalyticsProperties): void;
  /** Associates future events with a user id — called once after login. Never pass email/PII as the id itself. */
  identify(userId: string, properties?: AnalyticsProperties): void;
  /** Clears the identified user — called on logout. */
  reset(): void;
}
