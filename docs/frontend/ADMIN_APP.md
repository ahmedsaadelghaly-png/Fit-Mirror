# Platform Admin Web App (Phase 2.5)

The Platform Admin control center: dashboard, user management, store
management, product monitoring, try-on job monitoring, queue/worker
monitoring, AI service status, system health, audit logs, feature flags,
reports, and platform settings. Everything under `app/(admin)/admin/*` is
now real — no more static placeholder page. Mobile app remains out of
scope, per the Phase 2.5 brief.

## Phase 3.1 update — Users, Stores, Try-On Jobs are real

The backend now has a `platform_admin`-only `/admin` router enforced by
`require_role` (see `docs/API_CONTRACTS.md` "Platform Admin"). The Users,
Stores, and Try-On Jobs sections — and the dashboard counts built from
them — call it directly:

| Action | Endpoint |
|---|---|
| List users / change role / activate-deactivate | `GET /admin/users`, `PATCH /admin/users/{id}` |
| List stores / verify / suspend | `GET /admin/stores`, `PATCH /admin/stores/{id}` |
| List try-on jobs / retry a failed one | `GET /admin/tryon-jobs`, `POST /admin/tryon-jobs/{id}/retry` |

Notes: suspending a store hides all its products from shoppers; retry
re-queues a failed job with its original inputs; `last_login_at` isn't
tracked yet, so it always shows "Never". Lists fetch up to 200 rows and
filter client-side. The localStorage `UserOverlay` / `StoreOverlay` /
`TryOnJobRetryOverlay` and the `resolve-user` / `resolve-store` adapters
were removed. The sections below describe the original Phase 2.5 state;
the table further down is updated.

## The central fact of this phase (Phase 2.5 — historical)

A thorough audit of the backend (routers, schemas, models, migrations,
docker-compose, `docs/RBAC.md`) found **exactly one** real, callable
endpoint relevant to this entire admin surface:

> `GET /health` — registered at the backend's root (`backend/app/main.py`),
> **not** under `/api/v1` like every other endpoint this app calls.
> Unauthenticated, returns `{"status": "ok", "service": "..."}`.

Everything else — a `/admin` router, cross-tenant listing of users/stores/
products/try-on jobs, Celery queue/worker monitoring, an AI-service health
proxy, audit logging, feature flags, storage metrics — **does not exist
anywhere in the backend**, not even as a stub or 501 placeholder (contrast
with `/stylist/suggestions`, which *does* 501). `docs/RBAC.md` itself says
so explicitly: *"a `platform_admin` today has no more API access than a
`shopper` except by direct database access."* There is also no
`require_role()` dependency implemented anywhere — role enforcement for
`/admin/*` happens only in the frontend (`middleware/auth-guard.ts`'s
`ROLE_PROTECTED_PREFIXES`, unchanged since Phase 2.1) and, redundantly, in
this phase's `AdminGuard` component.

Per the Phase 2.5 rules ("create typed frontend adapters with mocked/
placeholder data and document every mismatch"), this phase is built almost
entirely against a deterministic, realistic mock dataset
(`api/admin/mock-data.ts`), with the one real health check wired in
wherever it's relevant (the dashboard's AI-health tile is mocked, but
System Health's "Backend" row is real).

## Folder structure

```
frontend/
  types/admin.ts
  api/admin/
    health.ts            The ONE real call — GET /health (root, no /api/v1, no auth)
    mock-data.ts          Single source of truth for every mocked fixture (10 users, 5 stores, 12 products, 8 try-on jobs, 3 workers, ...)
    shared.ts              Simulated-latency helper shared by every mocked module
    users.ts, stores.ts, products.ts, tryon-jobs.ts   List + localStorage overlay for the one "admin action" each supports
    queue.ts, ai-service.ts, system-health.ts, audit-log.ts, feature-flags.ts, reports.ts
  features/admin/
    schemas.ts             Feature-flag environment/rollout validation
    lib/
      dashboard-summary-adapter.ts    Pure adapter — unit tested
      system-health-adapter.ts        Pure adapter — unit tested
      resolve-user.ts, resolve-store.ts, resolve-admin-product.ts   Merge mock row + local overlay
    hooks/                 One TanStack Query hook per file (23 hooks — list/filter/mutate per resource)
    components/
      admin-guard.tsx       The "permission state" gate every page renders through
      mocked-badge.tsx      The "this data is mocked" label every mocked view surfaces
      service-status-badge.tsx   Shared healthy/degraded/down/unknown badge
      dashboard/, users/, stores/, products/, tryon-jobs/, queue/, ai-services/, system-health/, audit-log/, feature-flags/, reports/, settings/
  app/(admin)/admin/
    page.tsx                          Dashboard
    users/page.tsx, users/[id]/page.tsx
    stores/page.tsx, stores/[id]/page.tsx
    products/page.tsx, products/[id]/page.tsx
    tryon-jobs/page.tsx, tryon-jobs/[id]/page.tsx
    queue/page.tsx
    ai-services/page.tsx
    system-health/page.tsx
    audit-logs/page.tsx
    feature-flags/page.tsx
    reports/page.tsx
    settings/page.tsx
  shared/utils/export-csv.ts   Real CSV-download utility (used by Audit Logs + Reports — the export mechanism is real, the rows are mocked)
```

Every `page.tsx` is a thin server component that sets `metadata` and
renders one client `*View` component wrapped in `<AdminGuard>`, matching
the pattern from Phases 2.3/2.4.

## What's real vs. mocked, section by section

| Section | Real | Mocked |
|---|---|---|
| Dashboard | User/store/try-on counts (Phase 3.1) | Product counts, queue, AI health, alerts, storage |
| User Management | Roster, activate/deactivate, role change (Phase 3.1) | Sessions, last login, audit history |
| Store Management | Roster, verify/suspend, owner email (Phase 3.1) | — |
| Product Monitoring | — | Roster, flag/hide, image moderation |
| Try-On Jobs Monitoring | Roster, retry, failure-reason grouping (Phase 3.1) | — |
| Queue & Worker Monitoring | — | Everything |
| AI Services | — | Everything (model, GPU, latency, error rate) |
| System Health | `GET /health` → the "Backend" row | PostgreSQL, Redis, storage, AI service rows |
| Audit Logs | — (log entries) | Log entries themselves; CSV export mechanism is real |
| Feature Flags | — | The 6 flags themselves — **but toggling one persists to localStorage and survives a refresh**, unlike every other mocked view |
| Reports | — | Time series; CSV export mechanism is real |
| Platform Settings | — | Every section — no editable state at all, pure "Planned" cards |

Every mocked view carries a visible `MockedBadge` ("Mocked data" or a
context-specific label) per the Phase 2.5 UX requirement. `SystemHealthView`
goes further and labels each individual row "Live" or "Mocked" rather than
one badge for the whole page, since it's the one page mixing both.

## The `ProductModerationOverlay` pattern (the only overlay left after Phase 3.1)

Same shape as Phase 2.4's `ProductOverlay`: a localStorage record per
entity, merged onto the mock row by a pure `resolve*` adapter
(`features/admin/lib/resolve-user.ts` etc.), consumed by every table and
detail view so the merge logic lives in one place. Real, interactive UI —
activating a user, verifying a store, flagging a product, requesting a
retry all update the screen immediately and survive a refresh — just not
synced to any backend, because there's nothing to sync to.

**Feature flags are the one exception that's fully "real" persistence**:
`api/admin/feature-flags.ts` seeds from `MOCK_FEATURE_FLAGS` once, then
every subsequent read/write goes through localStorage directly (not a
seed-plus-overlay merge) — toggling `ai_stylist_enabled` off and refreshing
keeps it off, because a feature-flag UI that forgets your changes on
refresh would defeat the entire point of building one.

## Testing

Unit tests (Vitest + Testing Library), added under `tests/unit/`:

- `features/admin-schemas.test.ts` — feature-flag environment/rollout validation
- `features/admin-dashboard-summary-adapter.test.ts` — the pure dashboard adapter (user/store/product counts, try-on status grouping, queue sums, worker online count)
- `features/admin-system-health-adapter.test.ts` — the pure system-health adapter (worst-status-wins escalation, AI service folded in as a check)
- `features/admin-filters.test.tsx` — `useAdminUsers`/`useAdminProducts` client-side filtering, with `@/api/admin/users` and `@/api/admin/products` mocked
- `api/admin-mocks.test.ts` — every `list*` adapter resolves the fixed mock roster; every overlay (user/store/product/retry) round-trips through localStorage; `updateFeatureFlag` only touches the targeted flag

Playwright smoke tests, added at `tests/e2e/admin-smoke.spec.ts`:

- Admin dashboard (renders with mocked-data labels visible)
- Users management (lists mock users, filters by role)
- Stores management (lists mock stores with verification status)
- Products monitoring (lists mock products across stores)
- Try-on jobs monitoring (status filter tabs, retry action)
- Feature flags (toggling a flag persists across a page reload — the one
  admin action this suite verifies survives a refresh)
- Route-protection checks for the new Admin routes

Same approach as `tests/e2e/shopper-smoke.spec.ts`/`brand-smoke.spec.ts`: a
`fm_access_token` cookie with a `platform_admin` role claim. Unlike
Shopper/Brand, almost no `page.route` network stubbing is needed — the
data is generated client-side, not fetched — except for the one real
`GET /users/me` call every page makes via `useAuth()`/`AdminGuard`.

Storybook: six new component stories for Admin-specific components that
don't depend on `next/link` — see `docs/frontend/STORYBOOK.md` "Stories
written (Phase 2.5)".

## Run / test commands

```bash
cd frontend
npm install
npm run typecheck
npm run lint
npm run test              # vitest unit tests
npx playwright install    # one-time
npm run test:e2e          # includes admin-smoke.spec.ts
npm run storybook
npm run dev                 # http://localhost:3000/admin — the one real call (GET /health) needs the backend running; every other admin view works with no backend at all
```

## What would need real backend work to stop being mocked

- ~~A `platform_admin`-scoped `/admin` router with `require_role()`~~ — done (Phase 3.0)
- ~~Cross-tenant listing for users/stores/try-on jobs~~ — done (Phase 3.0/3.1); products still mocked
- A Celery/queue monitoring endpoint (queue depth, worker status, retry/dead-letter queues) — Flower or a custom endpoint
- A proxy (or direct network exposure) for the AI service's `GET /api/v1/health`, plus real model registry/GPU/latency telemetry
- An `AuditLog` model, migration, and endpoint (there are currently zero migrations in this repo at all)
- A `FeatureFlag` model/table/endpoint (today: two unrelated infra booleans in `config.py`)
- Storage usage/quota reporting
- Product moderation actions (flag, hide) persisted server-side — store verify/suspend are done (Phase 3.1)
- Platform Settings of any kind (general/security/storage/AI/notifications)
