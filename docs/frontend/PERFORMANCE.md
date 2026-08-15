# Performance (Phase 2.6)

## Next.js image optimization

Already configured since Phase 2.1 (`next.config.mjs`'s `images.remotePatterns`)
for `next/image`-eligible hosts. In practice, this app's user-generated
images (wardrobe items, try-on results, product photos) are rendered via
`shared/components/resolved-image.tsx` / `shared/components/image-upload-
field.tsx` using a plain `<img>`, **not** `next/image` — a deliberate
choice from Phase 2.3 (see those files' docstrings): the resolved URLs are
either arbitrary external bucket hosts (no fixed domain to allowlist) or
local `blob:` object-URL previews, neither of which benefits from Next's
build-time image optimization, and using a plain `<img>` keeps those two
components Storybook-safe (see `docs/frontend/STORYBOOK.md`). `next/image`
remains the right choice for static, first-party assets (the marketing
pages currently use none beyond the text-based `Logo` component) — nothing
to convert today.

## Dynamic imports for heavy components / route-level code splitting

Next.js's App Router already code-splits **per route** automatically —
every `page.tsx` across Shopper/Brand/Admin (Phases 2.3–2.5) ships its own
JS chunk, not one monolithic bundle. No additional route-level splitting
was needed.

Explicit `next/dynamic` component-level splitting was not added in this
pass — there isn't yet a component heavy enough (a real charting library,
a rich text editor, ...) to justify it: `features/admin/components/
reports/mini-bar-chart.tsx` is a hand-rolled `<div>`-based bar chart (see
"Virtualized/heavy component placeholders" below and
`docs/frontend/ADMIN_APP.md`), not a real charting dependency. **When a
real one is added**, wrap it like:

```tsx
import dynamic from "next/dynamic";
const RealChart = dynamic(() => import("./real-chart"), { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> });
```

## Lazy loading for charts/placeholders

Same answer as above — `MiniBarChart` and every "Planned"/mocked card
across Admin (`PlannedSectionCard`, `StorageUsagePlaceholderCard`, ...) are
cheap `<div>`-based components, not lazy-load candidates. Documented here
so the decision (not deferred by oversight) is visible.

## Bundle analyzer setup

`next.config.mjs` conditionally wraps `nextConfig` with
`@next/bundle-analyzer` when `ANALYZE=true`:

```bash
npm run analyze   # ANALYZE=true next build — opens an interactive treemap per bundle
```

Not wrapped unconditionally — `@next/bundle-analyzer` is a devDependency,
and there's no reason to pay even the `import()` cost outside an explicit
analysis run.

## React render optimization

No blanket `React.memo`/`useMemo` sweep across ~150 components — most of
this app's components are pages/forms that render once per navigation or
per mutation, not hot loops. Where a real optimization opportunity exists
(client-side filtering over a full list on every keystroke — see
"Debounced search" below) that's the actual fix, not memoization.
`features/admin/hooks/use-products.ts`/`use-users.ts`/`use-admin-products.ts`
already `useMemo` their filtered-list derivation (established since Phase
2.4) — that pattern continues to be the right one for new list hooks.

## TanStack Query cache tuning / stale time policies / retry policies

`lib/performance/query-config.ts` — extracted from `providers/query-
provider.tsx` (previously inlined, identical behavior otherwise):

- `STALE_TIME.{LONG, STANDARD, SHORT, NONE}` — named tiers instead of a
  magic number at each call site. `STANDARD` (30s) remains the
  `QueryClient` default, unchanged from Phase 2.1; new hooks can opt into
  `SHORT` (queue/worker status, active job polling) or `LONG` (rarely-
  changing identity data) explicitly.
- `shouldRetryQuery` — same policy as before (no retry on 4xx, up to 2
  retries on 5xx/network failure), now a named, unit-tested export
  (`tests/unit/lib/performance.test.ts`) instead of an inline arrow
  function only exercised indirectly.

Not retrofitted into every existing `useQuery` call's `staleTime` in this
pass (most inherit the provider default already, which is correct for
them) — adopt a non-`STANDARD` tier only where the reasoning above
actually applies.

## Pagination strategy improvements

Every list endpoint this app calls returns its **full** result set — no
backend endpoint (`/wardrobe`, `/tryon`, `/store/products`, the entire
mocked Admin surface) accepts `page`/`limit`/`cursor` params (confirmed
across Phases 2.3–2.5's backend research). `lib/performance/paginate.ts`
(pure function) + `hooks/use-pagination.ts` (React wrapper, resets to
page 1 if a filter shrinks the list below the current page) paginate the
already-fetched array client-side. Not yet adopted by any existing list
view — the largest lists today (Admin's mock fixtures, ~12 products, ~10
users) don't yet need it — but ready to drop into any view that grows
past comfortable scroll length, and trivial to delete once a backend list
endpoint adds real pagination (only the fetch layer changes).

## Debounced search utilities

`hooks/use-debounced-value.ts` (wraps `lib/performance/debounce.ts`) —
every search filter across Shopper/Brand/Admin (Wardrobe, Products, Users,
Try-On history, Audit Logs, ...) currently re-filters synchronously on
every keystroke. Swapping the raw filter value for
`useDebouncedValue(filters.search)`'s output cuts that to one filter pass
per pause in typing, with zero change to the filter logic itself. Not
retrofitted into every existing search input in this pass (a mechanical
but wide-reaching diff across ~10 files) — the hook is ready; adopting it
is a follow-up.

## Virtualized table placeholder for large lists

No dedicated component was added — none of today's lists (largest: ~12
mock Admin products) are anywhere near the length where virtualization
(e.g. `@tanstack/react-virtual`, `react-window`) would matter, and adding
that dependency for zero current benefit isn't justified. **When a list
genuinely grows large** (thousands of rows once real backend data
replaces the Admin mocks), reach for `@tanstack/react-virtual` — it's
already the same vendor as `@tanstack/react-query`, already a project
dependency family, so no new ecosystem to learn. Documented here as the
recommended approach rather than building a placeholder component with
nothing to virtualize yet.

## Web vitals reporting hook

`hooks/use-web-vitals.ts` wraps Next.js's built-in `useReportWebVitals`
(Core Web Vitals: CLS, FCP, INP, LCP, TTFB) — logs every metric via
`lib/monitoring/logger.ts` and forwards it to the analytics adapter (see
`docs/frontend/ANALYTICS.md`) as a `web_vitals` event. Mounted once in
`providers/app-providers.tsx`. This reports **real field data** from
actual page loads, complementing (not replacing) Lighthouse's synthetic
lab data (see "Lighthouse CI" below).

## Lighthouse CI

`.lighthouserc.json` (repo root of `frontend/`) — asserts minimum scores
(performance ≥0.8 warn, accessibility ≥0.9 error, best-practices/SEO ≥0.9
warn) against `/`, `/features`, `/login`, run via `npm run lighthouse`
(`lhci autorun`). Requires `npm run build` first (`startServerCommand`
runs `node .next/standalone/server.js`, the standalone output — see
`docs/DEPLOYMENT_FRONTEND.md`). Not wired into CI as a required check in
this pass (Lighthouse runs are slow and can be flaky in shared CI
runners) — see `.github/workflows/ci.yml`'s `frontend-lighthouse` job,
which runs but doesn't block the pipeline (`continue-on-error: true`).

## Testing

`tests/unit/lib/performance.test.ts` — `debounce` (fake timers: batches
rapid calls, passes the latest arguments, `cancel()` works),
`paginate` (slicing, clamping, empty-array edge case), `shouldRetryQuery`
(4xx never retries, 5xx retries up to the limit, network errors retry).
