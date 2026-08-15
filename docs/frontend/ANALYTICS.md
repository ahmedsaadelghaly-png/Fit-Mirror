# Analytics (Phase 2.6)

## Adapter pattern

Per the Phase 2.6 rule ("do NOT hardcode a vendor — use an adapter
pattern"), every call site depends only on the `AnalyticsAdapter`
interface (`lib/analytics/types.ts`):

```ts
interface AnalyticsAdapter {
  name: string;
  pageView(path, properties?): void;
  track(eventName, properties?): void;
  identify(userId, properties?): void;
  reset(): void;
}
```

`lib/analytics/adapter.ts` ships two real (not stub) implementations:

- `noopAnalyticsAdapter` — every method is a genuine no-op. The default in
  any environment where `NEXT_PUBLIC_APP_ENV !== "development"` and no
  real vendor has been registered — silent until one is.
- `consoleAnalyticsAdapter` — logs every call via `lib/monitoring/logger.ts`.
  The default in development, so engineers can see what *would* be sent
  without standing up a real analytics account.

`getAnalyticsAdapter()` returns whichever is active (cached after first
call); `setAnalyticsAdapter(adapter)` swaps in a real one. To wire in a
real vendor (PostHog, Segment, GA4, ...):

```ts
// e.g. in providers/app-providers.tsx, once:
import { setAnalyticsAdapter } from "@/lib/analytics";

setAnalyticsAdapter({
  name: "posthog",
  pageView: (path, props) => posthog.capture("$pageview", { path, ...props }),
  track: (event, props) => posthog.capture(event, props),
  identify: (userId, props) => posthog.identify(userId, props),
  reset: () => posthog.reset(),
});
```

No vendor SDK is installed in this repo — that call site is illustrative,
not wired in.

## Page view tracking

`trackPageView(path, properties?)` (`lib/analytics/events.ts`) — a real
call through to the active adapter. Not wired to a route-change listener
automatically in this pass (that requires picking a router-event API and
would be a Next.js-version-specific addition); call it from a
`usePathname()`-based effect wherever page-view tracking is prioritized.

## Event tracking

`trackEvent(eventName, properties?)` — the generic call every
domain-specific helper below wraps. `AnalyticsProperties` only accepts
`string | number | boolean | null | undefined` values (no nested
objects) — see "Privacy-safe design" below for why.

## Feature funnels (placeholders — not yet called from feature code)

Three typed helper groups document the event vocabulary product/analytics
would want, without yet instrumenting the actual components (that's a
per-feature follow-up, not part of this infrastructure pass):

- `tryOnFunnel` — `started`, `photosUploaded`, `jobCreated`, `jobCompleted`,
  `jobFailed`, `lookSaved`. Would be called from
  `features/tryon/components/tryon-workspace.tsx`.
- `brandProductFunnel` — `productFormOpened`, `productCreated`,
  `variantAdded`. Would be called from `features/brand/components/products/`.
- `adminActionEvents` — `userRoleChanged`, `storeVerified`,
  `productFlagged`, `featureFlagToggled`. Would be called from the
  corresponding `features/admin/hooks/use-*` mutation `onSuccess` callbacks.

## Privacy-safe analytics design

- `identify(userId, ...)` takes an **opaque id** (the user's UUID), never
  an email or name — the same id already used as the JWT `sub` claim, not
  new PII exposure.
- `AnalyticsProperties` is a flat `string | number | boolean` map by type
  — this is a soft guardrail (TypeScript, not a runtime scrub) against
  accidentally passing a nested object that might contain more than
  intended; it does not by itself guarantee no PII ever reaches a
  property value, since a caller could still pass e.g. someone's email as
  a `string`. Reviewing each new `trackEvent` call site's properties for
  PII before shipping it is still the caller's responsibility — documented
  here explicitly rather than implied.
- No cookies/localStorage are written by this module itself — a real
  vendor adapter (once registered) owns whatever persistence it needs for
  its own session/anonymous-id tracking, and should document its own
  cookie/consent behavior separately.
- The `noop` default means **no analytics data is sent anywhere** until a
  real adapter is explicitly registered — nothing "phones home" out of the box.

## Testing

`tests/unit/lib/analytics.test.ts` — verifies `getAnalyticsAdapter()`
picks `console` in development / `noop` otherwise, that
`setAnalyticsAdapter` overrides the cached instance, and that every
`tryOnFunnel`/`brandProductFunnel`/`adminActionEvents` helper calls
`track` with the expected event name and property shape.
