# FitMirror AI — Frontend

Next.js (App Router) + TypeScript + Tailwind + shadcn/ui frontend for
FitMirror AI: real authentication, public marketing pages, and complete
Shopper/Brand/Admin web applications, hardened for production and
**validated end-to-end against a real running backend** (Phase 2.7 — see
the root [`docs/VALIDATION_REPORT.md`](../docs/VALIDATION_REPORT.md)).
See the root [`README.md`](../README.md) for the full-stack picture and
Docker Compose quickstart; this file covers frontend-only commands for
working in this directory directly.

Full architecture docs: [`docs/frontend/`](../docs/frontend/) (from the
repo root) — start with `FRONTEND_ARCHITECTURE.md`. The production-
readiness docs (`PERFORMANCE.md`, `ACCESSIBILITY_AUDIT.md`, `SEO.md`,
`OBSERVABILITY.md`, `ANALYTICS.md`, `SECURITY_FRONTEND.md`, `UX_SYSTEM.md`)
and the root-level `docs/DEPLOYMENT_FRONTEND.md` cover the Phase 2.6
hardening; the root-level `docs/LOCAL_RUNBOOK.md` has troubleshooting for
every failure mode actually hit while validating this app end-to-end.

## Setup

```bash
npm install
cp .env.local.example .env.local   # only needed if NOT using Docker Compose
```

**Node.js 20.19+ required** (not just 20.x) — `npm run dev`/`build` work
on older 20.x, but `npm run storybook`/`build-storybook` enforce this
floor and fail with a clear version error otherwise.

## Development

```bash
npm run dev              # dev server at http://localhost:3000 (hot reload)
npm run build              # production build (output: standalone — see docs/DEPLOYMENT_FRONTEND.md)
npm run start               # run the production build locally
```

## Code quality

```bash
npm run lint                # ESLint
npm run lint:fix            # ESLint with --fix
npm run format               # Prettier --write
npm run format:check         # Prettier --check (what CI runs)
npm run typecheck            # tsc --noEmit
```

## Testing

```bash
npm run test                 # Vitest, single run
npm run test:watch           # Vitest, watch mode
npm run test:coverage        # Vitest with coverage report

npx playwright install       # one-time: downloads browser binaries
npm run test:e2e             # Playwright e2e tests (starts the dev server automatically)
npm run test:e2e:a11y        # axe-core accessibility scans (Phase 2.6 — see docs/frontend/ACCESSIBILITY_AUDIT.md)
```

Set `PLAYWRIGHT_PROD_BUILD=true` before `npm run test:e2e`/`test:e2e:a11y`
to run Playwright against a real production build+start instead of the dev
server — see `playwright.config.ts`.

As of Phase 2.7: 187/187 unit tests and 58/58 e2e tests (`--project=chromium`)
pass against a real running backend — see
[`docs/SMOKE_TESTS.md`](../docs/SMOKE_TESTS.md) for the full e2e coverage
breakdown and [`docs/VALIDATION_REPORT.md`](../docs/VALIDATION_REPORT.md)
for what these tests caught before they were fixed (a CSP misconfiguration
that silently blocked every API call in a real browser, and an infinite
loading loop on the body profile page — neither visible in a code review,
only by actually running the app). If pages hang on a loading skeleton
against a real backend with no visible network error, check the browser
console for a `Content-Security-Policy` violation first.

See [`docs/frontend/FRONTEND_ARCHITECTURE.md`](../docs/frontend/FRONTEND_ARCHITECTURE.md)
"Testing strategy" for what's covered by each layer, and
[`docs/frontend/AUTHENTICATION.md`](../docs/frontend/AUTHENTICATION.md)
"Testing" for the auth-specific test inventory.

## Production readiness gates (Phase 2.6)

```bash
npm run analyze              # ANALYZE=true next build — interactive bundle treemap
npm run lighthouse           # lhci autorun against a production build (requires `npm run build` first)
npm run audit                 # npm audit --omit=dev — checks production deps for known vulnerabilities
```

See [`docs/frontend/PERFORMANCE.md`](../docs/frontend/PERFORMANCE.md) for
what's tuned (cache policy, debouncing, pagination, web vitals) and what's
intentionally deferred (virtualization, route-level dynamic imports) until
there's real data volume to justify them.

## Storybook

```bash
npm run storybook            # dev server at http://localhost:6006
npm run build-storybook      # static build to storybook-static/ (also verifies stories compile)
```

See [`docs/frontend/STORYBOOK.md`](../docs/frontend/STORYBOOK.md) for
setup details and the full list of documented components.

## Environment variables

| Variable                             | Purpose                                                                                                                                                                                                                                                                                                          | Default                                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`           | Backend API base URL (browser-readable)                                                                                                                                                                                                                                                                          | `http://localhost:8000/api/v1`                                                           |
| `NEXT_PUBLIC_APP_ENV`                | `development` \| `test` \| `production`                                                                                                                                                                                                                                                                          | `development`                                                                            |
| `NEXT_PUBLIC_S3_PUBLIC_BASE_URL`     | Optional. Public base URL (including bucket) for resolving storage keys to _direct, unsigned_ image URLs — requires a public-read bucket. No backend "resolve download URL" endpoint exists yet — see `docs/frontend/SHOPPER_APP.md`.                                                                            | unset (falls back to a placeholder icon)                                                 |
| `NEXT_PUBLIC_S3_PUBLIC_ENDPOINT_URL` | Optional. Browser-reachable storage origin — widens the CSP `connect-src` so the browser can PUT directly to a pre-signed upload URL there (see `features/shopper/hooks/use-upload.ts`). Deliberately separate from the var above — this one only affects what CSP permits, not what URLs the app tries to load. | unset (upload PUTs to a storage origin outside `connect-src` are blocked by the browser) |
| `NEXT_PUBLIC_SENTRY_DSN`             | Optional (Phase 2.6). If set, `lib/monitoring/sentry.ts` logs a warning that `@sentry/nextjs` isn't installed yet — this variable alone does **not** enable real error reporting. See `docs/frontend/OBSERVABILITY.md`.                                                                                          | unset (monitoring no-ops)                                                                |

Validated at startup via Zod — see `config/env.ts`. Only `NEXT_PUBLIC_*`
variables are readable by browser code; never put a secret behind that
prefix. `lib/security/validate-production-env.ts` additionally warns (never
throws) at runtime if a production build is missing recommended
configuration — see `docs/frontend/SECURITY_FRONTEND.md`.

## Production Docker build

```bash
docker build -t fitmirror-frontend:prod \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.example.com/api/v1 \
  --target runner \
  .
```

Multi-stage `Dockerfile` (`deps` → `builder` → `runner`), copying only
`.next/standalone` + `.next/static` + `public` into the final image, with a
`HEALTHCHECK` against `GET /api/health`. Full guide, `docker-compose.prod.yml`
service, and the `deploy/frontend/nginx.conf` reverse-proxy template:
[`docs/DEPLOYMENT_FRONTEND.md`](../docs/DEPLOYMENT_FRONTEND.md).

## Project structure

See [`docs/frontend/FRONTEND_ARCHITECTURE.md`](../docs/frontend/FRONTEND_ARCHITECTURE.md)
for the full folder-by-folder breakdown and the rules for what belongs
where. Phase 2.6 additions worth knowing up front:

- `lib/performance/`, `lib/monitoring/`, `lib/analytics/`, `lib/security/`,
  `lib/seo/` — cross-cutting concerns, each documented in its own
  `docs/frontend/*.md` file.
- `components/error-boundary/` — reusable class-component error boundary.
- `features/notifications/`, `features/command-palette/` — global UX
  systems (notification center, Cmd+K/Ctrl+K palette).
- `hooks/use-web-vitals.ts`, `use-network-status.ts`,
  `use-debounced-value.ts`, `use-pagination.ts`, `use-optimistic-mutation.ts`
  — new hooks; see `docs/frontend/PERFORMANCE.md` and `UX_SYSTEM.md` for
  which existing views have adopted them so far vs. which are follow-ups.
