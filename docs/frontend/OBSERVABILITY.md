# Observability — Error Monitoring & Logging (Phase 2.6)

## Sentry integration — configurable placeholder

`lib/monitoring/sentry.ts` is a **placeholder adapter, not a real Sentry
integration** — per the Phase 2.6 rule ("mark vendor integrations as
configurable placeholders"), `@sentry/nextjs` is **not** an installed
dependency. Importing it unconditionally would break the build for every
environment that hasn't installed/configured it. `reportToSentry()`
no-ops unless `NEXT_PUBLIC_SENTRY_DSN` is set, and even then only logs a
reminder today. To make it real:

1. `npm install @sentry/nextjs`
2. `npx @sentry/wizard@latest -i nextjs` (generates the three Sentry config files)
3. Replace `reportToSentry`'s body with a real `Sentry.captureException(error, { extra: context })` call
4. Add `NEXT_PUBLIC_SENTRY_DSN` to `config/env.ts`'s schema and your deployment environment

## Error boundary

`components/error-boundary/error-boundary.tsx` — a React class component
(required: `getDerivedStateFromError`/`componentDidCatch` have no hook
equivalent) wrapping an arbitrary subtree. Next.js's own `app/error.tsx`
only catches errors at the **route-segment** level — a single dashboard
widget throwing still takes down the entire page unless something more
granular sits between it and the route boundary. `ErrorBoundary` is that
granular layer: on a render error in its subtree, it shows a local
`ErrorState` (or a custom `fallback`) with a "Try again" reset, and calls
`captureError()` so the failure is logged/reported.

**Applied once, as a reference example**: the Admin dashboard's
`AlertsPanel` tile (`features/admin/components/dashboard/dashboard-view.tsx`)
— if that panel throws, only its tile shows an error state; the rest of
the dashboard (user/store/product counts, quick actions, ...) stays fully
interactive. Not applied to every widget across every dashboard in this
pass (that's a much larger diff); adopt the same pattern anywhere else a
single widget's failure shouldn't block the page.

## Global error page / not-found page

Both already existed before this phase (Phase 2.2) and needed no
structural change:

- `app/error.tsx` — route-segment error boundary (below the root layout),
  reuses `PublicHeader`/`PublicFooter` so a crash still looks like part of
  the product.
- `app/global-error.tsx` — catches errors in the root layout itself;
  deliberately minimal/dependency-free (must render its own `<html>`/
  `<body>`, can't assume the design system's providers are healthy).
- `app/not-found.tsx` — the app-wide 404, also styled consistently.

`app/error.tsx`'s `useEffect(() => console.error(...))` now sits alongside
the same `captureError()` path used everywhere else — see the diff in
that file for the one-line addition.

## Client-side logging utility

`lib/monitoring/logger.ts` — `logger.debug/info/warn/error(message, context)`.
Every call is a real, structured `console.*` call today (level, ISO
timestamp, a plain `context` object — never a raw request/response body,
to avoid accidentally logging tokens/PII). Funneled through one module so
swapping the sink later (e.g. forwarding to a real log-ingestion endpoint)
is a one-file change, not a project-wide find-and-replace.

## API error tracking

`api/client.ts`'s response interceptor now calls a new
`reportUnexpectedApiError()` at both of its `Promise.reject(...)` sites,
wrapping (not replacing) `normalizeError()` — which stays exactly as pure
and unit-tested as before (see `tests/unit/api/normalize-error.test.ts`,
unchanged). `reportUnexpectedApiError` only calls `captureError()` for a
5xx status or a `null` status (network failure) — **not** for 4xx
(validation errors, bad credentials, not-found, ...), since those are
expected, user-facing outcomes the calling form already surfaces via
`ApiError.message`, not bugs worth alerting on.

## User action breadcrumbs — placeholder

`lib/monitoring/breadcrumbs.ts` — an in-memory ring buffer (last 20
entries) of `{category, message, timestamp, data}`. Real error-tracking
vendors (Sentry, Bugsnag) attach breadcrumbs like this to every captured
exception automatically; this is a vendor-agnostic substitute so
`captureError()` has something to attach even before a real vendor is
wired in. Not yet called from any UI interaction handler (that would mean
touching every button/form across five feature areas) — the "error"
category is the one place it's populated today, via `captureError()`
itself logging the error it just captured as a breadcrumb for the *next*
one.

## Performance tracing — placeholder

`lib/monitoring/tracing.ts` — `startSpan(name)` / `traced(name, fn)`
measure real wall-clock duration via `performance.now()` and log it
through `logger.debug`; nothing here is faked. Swap the body of
`Span.finish` for a real APM vendor call (Sentry Performance, Datadog RUM)
once one is wired in — same pattern as `sentry.ts`.

## `captureError()` — the one function to call

`lib/monitoring/index.ts` ties the above together:

```ts
captureError(error, context?) // logs locally + drops a breadcrumb + forwards to Sentry if configured
```

Called from `ErrorBoundary.componentDidCatch`, `api/client.ts`'s response
interceptor (for unexpected failures only), and available for any other
call site that catches an error worth reporting.
