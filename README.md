# FitMirror AI

Full-stack foundation for FitMirror AI, an AI fashion platform combining
Virtual Try-On, AI Stylist, Smart Wardrobe, Size Recommendation, Shopping
Assistant, and a Store Dashboard for brands — backend, AI service, and a
Next.js frontend with real authentication, public marketing pages, and
complete Shopper/Brand/Admin web applications, hardened for production
and **validated end-to-end against a real running stack**.

## Current phase status

| Phase | Status | Scope |
|---|---|---|
| Phase 1 | ✅ complete | Backend architecture, database schema, REST API contracts, async job pipeline, replaceable AI-service skeleton with a placeholder virtual try-on pipeline |
| Phase 1.5 | ✅ complete | Production tooling: Ruff/Black/isort/MyPy, pre-commit, Makefile, GitHub Actions CI, unit + integration tests, seed data, per-environment `.env` templates, hardened Docker Compose (dev/prod), structured JSON logging, rate-limit/security-header middleware placeholders, VS Code setup, project validation script |
| Phase 1.75 | ✅ complete | Complete system design documentation and technical contracts — see `docs/` |
| Phase 2.1 | ✅ complete | Frontend foundation: Next.js App Router + TypeScript + Tailwind + shadcn/ui project structure, design system, 18 base UI components, 5 page layouts, Axios API client + TanStack Query + Zustand foundation, Vitest + Playwright test tooling |
| Phase 2.2 | ✅ complete | Real authentication (cookie-based sessions, refresh-on-401, role-based route protection via middleware), 5 auth pages, 7 public pages, centralized design tokens, Storybook, 65 unit tests + extended Playwright coverage — see `docs/frontend/` |
| Phase 2.3 | ✅ complete | Shopper web app: dashboard, onboarding, body profile, photo upload, virtual try-on (flagship), try-on history, wardrobe, saved looks, AI Stylist/Shopping Assistant placeholders, settings — see `docs/frontend/SHOPPER_APP.md` |
| Phase 2.4 | ✅ complete | Brand/Store web app: dashboard, store onboarding, store profile, product management (CRUD + variants), inventory, analytics/customers/orders placeholders, settings — see `docs/frontend/BRAND_APP.md` |
| Phase 2.5 | ✅ complete | Platform Admin web app: dashboard, user/store/product/try-on-job monitoring, queue/worker + AI service + system health, audit logs, feature flags, reports, settings — mostly realistic mocked data (only `GET /health` is a real backend call), clearly labeled throughout — see `docs/frontend/ADMIN_APP.md` |
| Phase 2.6 | ✅ complete | Production readiness: performance (cache tuning, debouncing, pagination, bundle analysis, web vitals), accessibility (axe-core scans, table semantics), SEO (sitemap/robots/OG/structured data), error monitoring (error boundary, vendor-agnostic logging), analytics (adapter pattern), security hardening (CSP, headers, env validation), global UX (toasts, notification center, command palette, confirm dialogs, offline detection), production Docker/deploy, expanded CI — see `docs/frontend/PERFORMANCE.md`, `ACCESSIBILITY_AUDIT.md`, `SEO.md`, `OBSERVABILITY.md`, `ANALYTICS.md`, `SECURITY_FRONTEND.md`, `UX_SYSTEM.md`, and `docs/DEPLOYMENT_FRONTEND.md` |
| Phase 2.7 | ✅ complete | Full system validation: ran the entire stack for real (Docker Compose, all 7 services), found and fixed 8 critical/high-severity bugs invisible to prior phases' static-only audits (the Celery worker couldn't process any try-on job at all; no database migration existed; presigned upload URLs were unreachable from a real browser; the frontend's own CSP blocked its own API calls; a missing `"use client"` broke the production build; an infinite loading loop on the body profile page; a real WCAG contrast failure; a broken CI validation step) — see `docs/VALIDATION_REPORT.md`, `docs/KNOWN_ISSUES.md`, `docs/LOCAL_RUNBOOK.md`, `docs/SMOKE_TESTS.md` |
| **Phase 3.0** | ✅ **complete** | Backend catch-up: RBAC enforcement (`require_role`), product update/delete + variant CRUD, Platform Admin API (`/admin/*`), catalog browse, rule-based AI Stylist / Size Recommendation / Shopping Assistant (previously `501`), plus worker-retry, rate-limiter, upload-validation and performance fixes — see `ROADMAP.md` |
| **Phase 3.1** | ✅ **complete** | Frontend swap-over: Brand product edit/archive/variants and Admin users/stores/try-on jobs now use the real API (localStorage overlays removed); store suspension + failed-job retry; Shopping Assistant shows matched products with size recommendations |
| **Phase 3.2** | ✅ **complete** | Family profiles, catalog try-on, Saved Looks, style preferences, store business info, password reset, contact inbox, brand sign-up, batch download URLs — see `ROADMAP.md` |
| **Phase 4** | ✅ **complete** | Real AI behind the same contracts, each enabled by configuration with a built-in fallback: IDM-VTON diffusion try-on on Replicate, per-brand size charts and fit feedback, embedding stylist with a like/dislike loop, Claude query understanding — see `docs/AI_INTERFACES.md` |
| Phase 5 – 6 | ⏭️ next | Store Dashboard expansion and platform hardening — see `ROADMAP.md` |

No mobile app yet. Without API keys the AI features run on their built-in
fallbacks — see `ROADMAP.md` for the full phase sequence.

## Documentation index

### Root-level

| Doc | Covers |
|---|---|
| `ARCHITECTURE.md` | Full system design, DB schema, API summary, async flow, AI pipeline |
| `API_CONTRACTS.md` | Request/response JSON examples for every endpoint |
| `DEVELOPMENT.md` | Day-to-day local dev workflow, Makefile reference |
| `TESTING.md` | How to run/write unit + integration tests, CI behavior |
| `DEPLOYMENT.md` | Backend/AI service deployment options, secrets checklist, migrations in prod |
| `docs/DEPLOYMENT_FRONTEND.md` | Frontend production build, Docker, nginx, healthcheck, env vars, deployment checklist |
| `docs/VALIDATION_REPORT.md` | Phase 2.7: what was run, what broke, what was fixed — the definitive record of the full-stack validation pass |
| `docs/KNOWN_ISSUES.md` | Open issues (real gaps) vs. intentionally-mocked/deferred features (linked to their own docs) |
| `docs/LOCAL_RUNBOOK.md` | From-zero local setup, troubleshooting for the exact failure modes hit during validation |
| `docs/SMOKE_TESTS.md` | Copy-pasteable API + Playwright + manual smoke test scripts, with last-run results |
| `CONTRIBUTING.md` | Branching, commit style, code style, PR checklist |
| `ROADMAP.md` | What's planned in later phases |

### `docs/` — system design & technical contracts (Phase 1.75)

| Doc | Covers |
|---|---|
| `docs/ERD.md` | Entity-relationship diagram, table-by-table detail, relationship/cascade/index rules |
| `docs/API_CONTRACTS.md` | Exhaustive endpoint table: auth requirement, status codes, error responses per endpoint |
| `docs/SEQUENCE_DIAGRAMS.md` | Mermaid sequence diagrams for every major system flow |
| `docs/USER_FLOWS.md` | Mermaid flowcharts for every major user journey |
| `docs/RESPONSE_STANDARDS.md` | Success/error/pagination/validation/job-status response envelopes |
| `docs/ERROR_CODES.md` | Full error code catalog, HTTP status mapping, implementation status |
| `docs/RBAC.md` | Roles, full permission matrix, enforcement via `require_role` (since Phase 3.0) |
| `docs/MULTI_TENANCY.md` | Store isolation, ownership, product visibility, planned team support |
| `docs/STORAGE.md` | Object storage namespace catalog, key structure, upload flow |
| `docs/AI_INTERFACES.md` | `TryOnPipeline` interface, model registry, versioning, replacement rules |
| `docs/QUEUE_ARCHITECTURE.md` | Celery queues, retry strategy, timeouts, idempotency, status transitions |
| `docs/API_VERSIONING.md` | Versioning scheme, backward-compatibility & deprecation policy |
| `docs/FEATURE_FLAGS.md` | Planned backend feature flag catalog (frontend has its own mocked implementation — see `docs/frontend/ADMIN_APP.md`) |
| `docs/AUDIT_LOGGING.md` | Planned audit event catalog and write path (frontend has its own mocked implementation) |
| `docs/NOTIFICATIONS.md` | Planned notification architecture (outbox pattern) — frontend's notification center is a client-only placeholder against this same gap |
| `docs/SECURITY.md` | Backend: JWT, password hashing, rate limiting, image privacy, CORS, retention policy |
| `docs/NAMING_CONVENTIONS.md` | Naming rules for files, classes, routes, tables, env vars |

Everything under `docs/` (excluding `docs/frontend/`) describes the
backend/AI service — implemented and planned states clearly marked.

### `docs/frontend/` — frontend architecture, feature apps & production readiness

| Doc | Covers |
|---|---|
| `docs/frontend/FRONTEND_ARCHITECTURE.md` | Folder structure, state management decision rules, API client, auth, testing strategy |
| `docs/frontend/DESIGN_SYSTEM.md` | Color/typography/spacing/radius/shadow/motion tokens, dark mode, accessibility rules, visual rationale |
| `docs/frontend/COMPONENT_GUIDELINES.md` | Where components belong, the `components/ui/` shape, accessibility checklist |
| `docs/frontend/WEB_ROUTES.md` | Full route table, route groups explained, layout inheritance, middleware |
| `docs/frontend/AUTHENTICATION.md` | Session lifecycle, cookie-based token storage, refresh-on-401, role-based route protection |
| `docs/frontend/API_CLIENT.md` | Axios interceptors, error normalization, API error types, refresh flow |
| `docs/frontend/THEME_SYSTEM.md` | Design tokens architecture, light/dark mode, persistence, hydration |
| `docs/frontend/STORYBOOK.md` | Setup, why Vite (not Next) framework, all documented components |
| `docs/frontend/PUBLIC_PAGES.md` | Every public page's status, header/footer, 404/500 pages |
| `docs/frontend/SHOPPER_APP.md` | Shopper web app: features, API integration, documented contract mismatches |
| `docs/frontend/BRAND_APP.md` | Brand/Store web app: features, API integration, documented contract mismatches |
| `docs/frontend/ADMIN_APP.md` | Platform Admin web app: the one real endpoint vs. everything mocked, and why |
| `docs/frontend/PERFORMANCE.md` | Cache tuning, debouncing, pagination, bundle analysis, web vitals, Lighthouse CI |
| `docs/frontend/ACCESSIBILITY_AUDIT.md` | What was already solid, what changed, automated axe-core scans, manual-review gaps |
| `docs/frontend/SEO.md` | Metadata helper, sitemap, robots.txt, canonical URLs, structured data |
| `docs/frontend/OBSERVABILITY.md` | Error boundary, logging, breadcrumbs, tracing, Sentry placeholder, API error tracking |
| `docs/frontend/ANALYTICS.md` | Vendor-agnostic analytics adapter pattern, feature funnels, privacy design |
| `docs/frontend/SECURITY_FRONTEND.md` | CSP strategy, security headers, XSS checklist, token storage, env validation |
| `docs/frontend/UX_SYSTEM.md` | Toasts, notification center, command palette, confirm dialogs, offline detection |

## Repository layout

```
fitmirror-ai/
├── backend/                    FastAPI backend: REST API, DB models, Celery workers
│   ├── app/                    api → services → repositories → models (Clean Architecture)
│   ├── alembic/versions/       DB migrations (initial schema generated + applied in Phase 2.7)
│   ├── tests/{unit,integration}
│   ├── pyproject.toml          pytest + coverage config
│   ├── requirements.txt
│   ├── .dockerignore           excludes .venv/__pycache__/etc. from the build context (Phase 2.7)
│   └── Dockerfile
├── ai-service/                 FastAPI AI microservice: replaceable model pipelines
│   ├── app/                    pipelines/, models/ (registry), storage/
│   ├── tests/{unit,integration}
│   ├── pyproject.toml
│   ├── requirements.txt
│   ├── .dockerignore           (Phase 2.7)
│   └── Dockerfile
├── frontend/                   Next.js web app (see full tree in docs/frontend/FRONTEND_ARCHITECTURE.md)
│   ├── app/                    App Router: route groups (public/auth/shopper/brand/admin), layouts, pages, sitemap.ts, robots.ts, api/health/
│   ├── features/               Feature-first modules: auth/, shopper/, brand/, admin/, tryon/, notifications/, command-palette/
│   ├── components/ui/          shadcn/ui-style generic primitives (incl. toast/toaster)
│   ├── components/error-boundary/  Reusable class-component error boundary
│   ├── layouts/                Page-chrome layouts + shared sidebar/header
│   ├── lib/                    performance/, monitoring/, analytics/, security/, seo/ + auth/utils
│   ├── shared/, hooks/, api/, providers/, config/, types/, middleware/
│   ├── tests/{unit,e2e}        Vitest + Playwright (incl. accessibility.spec.ts) — unit and e2e suites
│   ├── .lighthouserc.json       Lighthouse CI config
│   ├── package.json, tsconfig.json, tailwind.config.ts, components.json
│   ├── .dockerignore            excludes node_modules/.next/storybook-static (Phase 2.7)
│   └── Dockerfile               Standalone-output production build
├── deploy/frontend/             nginx reverse-proxy template
├── scripts/
│   └── check_project.py        validates repo structure is complete
├── docs/                       system design & technical contracts (Phase 1.75), plus
│   │                            VALIDATION_REPORT.md / KNOWN_ISSUES.md / LOCAL_RUNBOOK.md / SMOKE_TESTS.md (Phase 2.7)
│   └── frontend/                frontend architecture, feature apps, production readiness
├── .github/workflows/ci.yml    lint + test + build + e2e + a11y + Lighthouse + docker-build-check, all services
├── .vscode/, .devcontainer/     editor setup
├── docker-compose.yml           base service definitions (healthchecks, restart policies)
├── docker-compose.dev.yml       dev overlay (hot reload, incl. frontend)
├── docker-compose.prod.yml      standalone production template (includes a frontend service)
├── pyproject.toml               shared Ruff/Black/isort/MyPy config (backend + AI service)
├── requirements-dev.txt         shared dev/tooling deps (backend + AI service)
├── .pre-commit-config.yaml
├── Makefile
├── .env.example / .env.dev.example / .env.test.example / .env.production.example
└── (docs listed above)
```

## Prerequisites

- Docker & Docker Compose v2 (the `docker compose` subcommand)
- Python 3.12+ (for local, non-Docker backend/AI-service development)
- Node.js 20.19+ (for local, non-Docker frontend development — Storybook enforces this floor; see `docs/LOCAL_RUNBOOK.md` if you hit a version error)
- `make` (optional — see `Makefile` for the raw commands)

## Quickstart

```bash
cp .env.dev.example .env
make up
```

This builds and starts: Postgres, Redis, MinIO, the AI service, the backend
API, a Celery worker, and the frontend (all with hot reload enabled).

```bash
# One-time bootstrap (every time you start from a fresh volume):
# Optional since the photo seed: `make seed` creates the bucket if it is missing.
docker compose exec minio mc alias set local http://localhost:9000 fitmirror fitmirror123
docker compose exec minio mc mb local/fitmirror-media

make migrate   # apply Alembic migrations
make seed      # load demo data: admin, shopper, brand, store, products, wardrobe items
```

Verify the stack is actually healthy, not just running:

```bash
docker compose ps                          # every service should say "healthy"
curl http://localhost:8000/health
curl http://localhost:8001/api/v1/health
curl http://localhost:3000/api/health
```

- Frontend: http://localhost:3000
- Backend API docs: http://localhost:8000/docs
- AI service docs: http://localhost:8001/docs
- MinIO console: http://localhost:9001 (`fitmirror` / `fitmirror123`)

**Demo credentials** (after `make seed`, password `DemoPass123!` for all three):
`admin@fitmirror.ai` (platform admin), `shopper@fitmirror.ai` (shopper), `brand@fitmirror.ai` (brand admin).

Full walkthrough, non-Docker setup, editor config, and troubleshooting for
every failure mode hit during Phase 2.7's validation: see `DEVELOPMENT.md`
and **`docs/LOCAL_RUNBOOK.md`** (start there if anything above doesn't
work as described). Production deployment: `docs/DEPLOYMENT_FRONTEND.md`
(frontend) and `DEPLOYMENT.md` (backend/AI service).

## Common commands

```bash
make up                    # start everything (hot reload, incl. frontend)
make down                  # stop everything
make logs                  # tail all container logs
make test                  # backend + AI service + frontend unit test suites
make test-frontend-e2e     # Playwright e2e (run `npx playwright install chromium` once first)
make test-frontend-a11y    # axe-core accessibility scans
make storybook              # Storybook dev server (http://localhost:6006)
make storybook-build        # static Storybook build (also verifies all stories compile)
make lint                  # Ruff + Black + isort (backend/AI) + ESLint + Prettier (frontend)
make format                 # auto-fix formatting/lint across all three codebases
make typecheck               # MyPy (backend/AI service) + tsc --noEmit (frontend)
make analyze-frontend        # frontend bundle analyzer
make lighthouse-frontend     # Lighthouse CI against a production build
make audit-frontend          # npm audit (production deps only)
make build-frontend-prod     # build the frontend's production Docker image
make migrate                 # apply DB migrations
make seed                    # load demo data
make clean                   # remove caches/coverage/build artifacts
make help                    # list every target
```

Every one of these was actually run and verified working in Phase 2.7 —
see `docs/VALIDATION_REPORT.md` "Commands run" for the exact sequence,
and `docs/LOCAL_RUNBOOK.md` if any of them fail for you the way they
initially failed during that validation pass.

Full reference: `DEVELOPMENT.md`. Testing details: `TESTING.md`,
`docs/SMOKE_TESTS.md`, and `docs/frontend/FRONTEND_ARCHITECTURE.md`
"Testing strategy".

## Validate your checkout

```bash
python scripts/check_project.py
```

Confirms every expected file/folder from Phase 1 through Phase 2.2 is
present (not yet extended to validate every later phase's additions —
see `ROADMAP.md`). For a real functional validation — does the stack
actually run, not just "are the files present" — see
`docs/VALIDATION_REPORT.md` and `docs/SMOKE_TESTS.md` instead.

## Trying the frontend against the real backend

With `make up` running (backend + frontend both up, migrations applied, seed loaded):

1. Visit http://localhost:3000 — the public home page. Browse
   `/features`, `/pricing`, `/about`, `/contact` from the header nav.
2. Visit `/shopper`, `/brand`, or `/admin` directly **while logged out** —
   middleware redirects you to `/login?redirectTo=...` (real route
   protection — see `docs/frontend/AUTHENTICATION.md`).
3. Log in with a seeded demo account (see credentials above), or click
   "Create your account" for a real `POST /auth/register` call.
4. Log in at http://localhost:3000/login → a real `POST /auth/login` +
   `GET /users/me` call, session persisted via cookies, then redirects to
   `/shopper`, `/brand`, or `/admin` based on the account's role.
5. Visit the dashboard for a *different* role than your account's — you
   land on `/unauthorized` instead.
6. Refresh the page — the session survives (cookie-based).
7. **Each dashboard is fully built out and confirmed working end-to-end**
   (Phase 2.7 validation — not just present, actually exercised against
   the real running stack):
   - **Shopper** (`docs/frontend/SHOPPER_APP.md`): wardrobe, virtual
     try-on (upload a photo + garment, watch the job move through
     pending → completed against the real placeholder AI pipeline —
     confirmed with a real browser-uploaded image producing a real
     result image, see `docs/VALIDATION_REPORT.md` item 4), try-on
     history, saved looks, body profile, onboarding.
   - **Brand** (`docs/frontend/BRAND_APP.md`): store onboarding, product
     catalog CRUD + variants (variant management is a documented
     localStorage placeholder — no backend endpoint exists for it yet),
     inventory.
   - **Admin** (`docs/frontend/ADMIN_APP.md`): platform dashboard, user/
     store/product/try-on-job monitoring, feature flags — **mostly
     realistic mocked data**, clearly labeled "Mocked data" throughout,
     since almost no cross-tenant/admin backend endpoint exists yet.
8. Try Cmd+K/Ctrl+K anywhere for the command palette, and toggle your
   network offline (DevTools → Network → Offline) to see the offline
   banner.

## Testing the end-to-end try-on flow

1. `POST /api/v1/auth/register`, then `POST /api/v1/auth/login` → access token.
2. `POST /api/v1/tryon/upload-url` → pre-signed URL; `PUT` your photo there
   directly from the browser (works out of the box as of Phase 2.7 — the
   URL is signed against `S3_PUBLIC_ENDPOINT_URL`, browser-reachable, not
   the Docker-internal `minio` hostname; see `docs/VALIDATION_REPORT.md`
   item 4 if you're on an older `.env`).
3. `POST /api/v1/tryon` with `user_image_key` + `garment_image_key` (or a
   `product_variant_id` from the seeded demo products).
4. Poll `GET /api/v1/tryon/{job_id}` until `status` is `completed` — the
   Celery worker calls the AI service's placeholder pipeline, which
   overlays a banner on your photo and stores the result.

Or just do this through the UI: Shopper → Try-On — see
`docs/frontend/SHOPPER_APP.md` for the full flow, or `docs/SMOKE_TESTS.md`
for a copy-pasteable script that does exactly this. Full request/response
shapes: `API_CONTRACTS.md`.

## Design principles

- **Clean Architecture:** `api` (routing) → `services` (business logic) →
  `repositories` (data access) → `models` (ORM). AI model logic lives
  entirely in the separate `ai-service`, never in the backend.
- Every try-on request creates a job row (`pending`) and returns
  immediately — actual generation happens asynchronously via Celery.
- Object storage is abstracted (`ObjectStorage` interface) so the provider
  can change without touching business logic.
- AI models are abstracted (`TryOnPipeline` interface + registry) so a real
  model can replace the placeholder without changing API contracts.
- Every HTTP request gets a correlation ID (`X-Request-ID`), propagated
  into structured logs (`app/core/logging_config.py`,
  `app/core/middleware.py`) in both services.
- **Frontend:** feature-first structure (`features/<area>/`), a single
  Axios client with normalized error handling, TanStack Query for server
  data and Zustand only for cross-component UI state, and a design system
  driven entirely by CSS variables — see `docs/frontend/DESIGN_SYSTEM.md`.
- **Auth is cookie-based (not localStorage) specifically so middleware can
  enforce real route protection** at the edge — see
  `docs/frontend/AUTHENTICATION.md`.
- **When a backend endpoint doesn't exist yet** (most of Admin, product
  editing/variants in Brand, saved looks in Shopper, ...), the frontend
  builds a typed adapter against realistic local/mocked data instead of a
  static/broken page — and documents the exact gap in that feature's
  `docs/frontend/*_APP.md`, verified by reading the actual backend source
  rather than assumed. This is a deliberate, repeated pattern, not an
  inconsistency.
- **Production readiness (Phase 2.6)** is additive, not a redesign: same
  architecture, same design system, same component conventions — just
  hardened (CSP/security headers, accessibility scans, error boundaries,
  vendor-agnostic analytics/monitoring adapters, a standalone-output
  Docker build).
- **Phase 2.7's rule was "fix, don't redesign."** Every fix in
  `docs/VALIDATION_REPORT.md` is the smallest change that makes the real
  bug go away — a missing import, a missing `"use client"`, a duplicated
  config value that fell out of sync, a prop instead of a second network
  subscription. Nothing was rearchitected to fix these; if a fix looks
  bigger than "the smallest change that closes the gap," that's worth
  a second look.
