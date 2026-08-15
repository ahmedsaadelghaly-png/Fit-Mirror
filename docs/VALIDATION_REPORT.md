# Phase 2.7 — Full System Validation Report

**Date:** 2026-07-09
**Scope:** Run the entire FitMirror AI stack for real (backend, AI service, frontend, Postgres, Redis, MinIO, Celery worker), find every build/runtime/integration issue, and fix it. No new features, no real AI model, no redesign, no architecture rewrite.

This is the first phase where the full stack was actually executed end-to-end. Phases 1 through 2.6 were built and validated exclusively through static analysis (grep-based import/export audits, manual code review) because the sandbox used in those phases had no Node.js, no `docker compose` plugin, and no way to run a real Postgres/Redis/MinIO stack. This phase had all of that, which is precisely why it surfaced bugs that fifteen prior "static audit" passes could not.

## Summary

| Area | Result |
|---|---|
| Backend (lint/format/types/unit/integration) | ✅ All pass |
| AI service (lint/format/types/unit/integration) | ✅ All pass |
| Frontend (lint/format/types/unit/build/Storybook) | ✅ All pass (after fixes) |
| Docker Compose (build + up, all 7 services) | ✅ All healthy (after fixes) |
| Database (Alembic migration + seed) | ✅ Working (migration had to be generated — none existed) |
| API smoke tests (20 checks across all endpoints) | ✅ 20/20 pass |
| Try-on placeholder pipeline, real upload → completed | ✅ Working end-to-end (after fixes) |
| Frontend routes + middleware route-gating | ✅ All correct |
| Playwright e2e (58 tests, chromium) | ✅ 58/58 pass (after fixes) |
| Accessibility (10 pages, axe-core WCAG 2.1 AA) | ✅ 10/10 pass (after fixes) |

**7 critical/high-severity bugs found and fixed.** All are described in detail below. `docs/KNOWN_ISSUES.md` lists what remains open and why each is intentionally out of scope for this pass.

## Environment setup (not a repo change, but required to do any of this)

The sandbox had Python 3.12 and a Docker daemon, but no Node.js and no `docker compose` plugin. Both were installed locally without root:
- Node.js 20.20.2 downloaded from nodejs.org, extracted to `~/.local/opt/node`, symlinked into `~/.local/bin` (already on `PATH`).
- `docker compose` v2.29.7 downloaded from GitHub releases into `~/.docker/cli-plugins/docker-compose`.

Neither of these is a repo file — they're sandbox-local tooling, not part of the commit.

---

## Bugs found and fixed

### 1. (Critical) Celery worker couldn't process any try-on job at all

**File:** `backend/app/workers/celery_app.py`

The very first `TryOnJob` database query in the worker process crashed with:

```
sqlalchemy.exc.InvalidRequestError: When initializing mapper Mapper[TryOnJob(tryon_jobs)],
expression 'User' failed to locate a name ('User').
```

`TryOnJob.user` is declared as a string relationship (`Mapped["User"] = relationship(...)`). SQLAlchemy only resolves that string the first time any mapper in the process is configured, and at that point every class referenced by a string relationship needs to already be imported *somewhere* in the process. The FastAPI app never hits this because `app.api.v1.router` transitively imports every endpoint module, and with it every model. The Celery worker only ever imports `app.workers.tasks.tryon_tasks` (per `celery_app.py`'s `include=[...]`), which imports `TryOnJob` but never `User`.

This meant **every single try-on job, unconditionally, failed** the moment the worker touched the database — caught by the task's broad `except Exception`, which marked the job `FAILED` with this exact stack trace as the `error_message`. This is as core-functionality-breaking as a bug gets, and it was invisible to every prior phase because the worker was never actually run.

**Fix:** `celery_app.py` now imports `app.db.base_all_models` (the module that already existed specifically to register every model for Alembic) at module load time, before the Celery app is constructed. Updated that module's docstring, which previously said "should not be imported by application runtime code" — that claim was itself the root cause; the worker *is* a second runtime entrypoint that doesn't get the FastAPI router's free ride.

### 2. (Critical) Seed script crashed with the identical root cause

**File:** `backend/app/db/seed.py`

Same underlying issue, different entrypoint: `python -m app.db.seed` imports `User`, `Store`, `Product`, `ProductVariant`, `WardrobeItem` directly but never `TryOnJob` — and `User.tryon_jobs` is a string relationship to `"TryOnJob"`. Running the documented `make seed` command crashed immediately.

**Fix:** Added `from app.models.tryon_job import TryOnJob  # noqa: F401` to `seed.py`'s imports, with a comment explaining why an apparently-unused import is required.

### 3. (Critical) No Alembic migration existed at all

**Files:** `backend/alembic/versions/` (new file), `docs/LOCAL_RUNBOOK.md`

A fresh `docker compose up` plus `alembic upgrade head` (the exact sequence documented in the root README) left the database with only the `alembic_version` bookkeeping table — zero domain tables. `alembic/versions/` was empty. Nobody had ever run `alembic revision --autogenerate` against the finished models.

**Fix:** Generated `7e46b1f0c366_initial_schema.py` via `alembic revision --autogenerate -m "initial schema"`, formatted it with the project's Black/isort/Ruff config, applied it, and confirmed `alembic check` reports zero drift against the current models (7 tables: `users`, `body_profiles`, `stores`, `products`, `product_variants`, `tryon_jobs`, `wardrobe_items`).

### 4. (Critical) Presigned upload URLs were unusable from a real browser

**Files:** `backend/app/core/config.py`, `backend/app/storage/s3_storage.py`, `.env.example`, `.env.dev.example`

`POST /api/v1/tryon/upload-url` returns a presigned S3 PUT URL. Under Docker Compose, `S3_ENDPOINT_URL` is overridden to `http://minio:9000` (the internal service name) so the backend/worker/AI-service can reach MinIO. But that same internal hostname was also baked into the presigned URL returned to the *browser* — which cannot resolve `minio`. A real user uploading a photo through the actual Shopper UI would get a silent `net::ERR_NAME_NOT_RESOLVED` and the upload would never happen.

This directly blocked the "upload user image, upload garment image" step of the flagship Virtual Try-On feature (task 10 of this validation) for anyone testing through a real browser, not just `curl`.

**Fix:** Added an optional `S3_PUBLIC_ENDPOINT_URL` setting. `S3ObjectStorage` now uses a second boto3 client, configured with that endpoint, purely for presigned-URL *signing* (not for the direct server-to-server calls, which keep using the internal endpoint). When unset, behavior is byte-for-byte identical to before. Set to `http://localhost:9000` in both env templates. Verified with a real `curl PUT` from the host machine against the resulting URL — `200 OK` — followed by a full upload → try-on job → `completed` round trip with zero manual MinIO intervention.

### 5. (Critical) The frontend's own CSP blocked every one of its own API calls

**File:** `frontend/next.config.mjs`

Phase 2.6 added a `Content-Security-Policy` header, with a `connect-src` directive hand-mirrored in `next.config.mjs` (a plain Node file that can't import the canonical, unit-tested TypeScript version in `lib/security/headers.ts`). The canonical version correctly reduces `NEXT_PUBLIC_API_BASE_URL` to just its origin before use. The `next.config.mjs` copy did not — it interpolated the full `http://localhost:8000/api/v1` (including the path) directly into `connect-src`.

CSP source expressions with a path are matched by *exact path prefix*, and a source with no trailing slash only matches that literal path — `http://localhost:8000/api/v1` does **not** match `http://localhost:8000/api/v1/wardrobe`. Every real fetch call from the browser (`/users/me`, `/wardrobe`, `/tryon`, everything) was silently blocked by the browser's own CSP enforcement, logged only as a CSP violation in the browser console. Every authenticated page in the app showed a permanent loading skeleton and never rendered — this is why 24 of the first 26 Playwright e2e failures in this pass looked like network hangs.

**Fix:** `next.config.mjs` now derives the origin via `new URL(...).origin` (same logic as the canonical TS version, just re-implemented in plain JS since the file can't import TS), producing `connect-src 'self' http://localhost:8000 ws: wss:`. Verified via a live diagnostic Playwright script capturing console/network events before and after — the dashboard went from a permanently-loading shell to fully rendering ("Welcome back, Ada", real widget data) after the fix and an image rebuild (`next.config.mjs` isn't bind-mounted in the dev Compose overlay, so this required a real `docker compose build frontend`).

### 5b. (Critical, found post-delivery) CSP also blocked the direct-to-storage upload PUT — "Upload failed. Please try again."

**Files:** `frontend/lib/security/csp.ts`, `frontend/lib/security/headers.ts`, `frontend/next.config.mjs`, `frontend/config/env.ts`

Found after this report's initial delivery, when a real upload attempt through the Shopper → Try-On UI failed with `useUpload`'s generic fallback message. Same root defect class as item 5, one layer deeper: fixing `connect-src` to include the *backend API* origin (item 5) was necessary but not sufficient — `features/shopper/hooks/use-upload.ts` PUTs the file bytes **directly to the pre-signed storage URL** (`http://localhost:9000/...`, a completely different origin from the backend), via a plain `axios.put()` call. `connect-src` never allowed that origin at all, in either `next.config.mjs` or the canonical `lib/security/csp.ts` — this gap predates Phase 2.7 entirely (`storageOrigin` was only ever wired into `img-src`, for `<img>` tags loading existing images, never into `connect-src`, for the browser initiating a new upload). It stayed invisible through every prior phase because CSP wasn't added until Phase 2.6, and item 5's bug meant *no* fetch worked at all until this same pass, so nobody had gotten far enough to trigger an upload against a real CSP header before now.

Confirmed via `curl` first (the presigned PUT itself works fine and CORS preflight succeeds — ruling out both) and then via a live Playwright browser test capturing console errors, which showed nothing until cross-referencing the CSP header directly.

**Fix:**
- `buildContentSecurityPolicy()` (`lib/security/csp.ts`) now adds `storageOrigin` to `connect-src`, not just `img-src`.
- Added a new env var, `NEXT_PUBLIC_S3_PUBLIC_ENDPOINT_URL`, deliberately **separate** from the existing `NEXT_PUBLIC_S3_PUBLIC_BASE_URL`. The existing var does two things at once — it's also what `shared/utils/resolve-image-url.ts` uses to build *unsigned, direct* image URLs, which requires the bucket to actually be public-read (this project's bucket isn't). Reusing it here would have silently started attempting broken direct image loads as a side effect of fixing uploads. The new var only ever widens CSP; it never changes what URLs the app tries to fetch.
- `next.config.mjs` and `lib/security/headers.ts` both updated in lockstep (same cross-module-system duplication as item 5, kept in sync by hand as documented).
- Set `NEXT_PUBLIC_S3_PUBLIC_ENDPOINT_URL=http://localhost:9000` in `.env.example`, `.env.dev.example`, and `docker-compose.yml`'s frontend service.
- Added a unit test (`tests/unit/lib/security.test.ts`) asserting the storage origin appears in `connect-src`, not just `img-src` — this exact bug had zero test coverage before.
- Verified with a real Playwright browser test performing a real login against the real backend and a real file upload through the actual `<input type="file">` — the UI advanced to "Replace photo" (upload succeeded) with no console errors and no CSP violations.

### 5c. (High, found post-delivery) Uploaded photos never actually displayed — resolved with a new backend endpoint

**Files:** `backend/app/api/v1/endpoints/tryon.py`, `frontend/api/storage.ts`, `frontend/hooks/use-resolved-image-url.ts`, `frontend/shared/components/resolved-image.tsx`, `frontend/next.config.mjs`

Reported directly by a user screenshot: every wardrobe/try-on/product image rendered as a broken-image placeholder icon, never the real photo. Root cause was **architectural, not a bug in the strict sense** — `shared/components/resolved-image.tsx` could only ever show a real `<img>` when `NEXT_PUBLIC_S3_PUBLIC_BASE_URL` was configured (a public-read bucket), which it never was; every read API (wardrobe, try-on, body profile) returns opaque object keys, and `StorageService.get_download_url()` — which already existed, fully implemented, on the backend — was never wired to a route. This was a known, explicitly documented gap since Phase 2.3 (`docs/frontend/SHOPPER_APP.md` "API contract mismatches" #4), not something this validation pass introduced.

Given the choice between (a) making the bucket public-read, (b) adding the missing backend endpoint, or (c) leaving it as documented behavior, the user chose (b) — a real fix, not a workaround.

**Fix:**
- Added `GET /tryon/download-url?object_key=...` (`create_download_url` in `tryon.py`), registered before the dynamic `/{job_id}` route (both are `GET` on the same router — route order matters). No new service logic — it's a thin route wrapping the pre-existing `StorageService.get_download_url()`, which already correctly uses the presigned-URL client from item 4's fix (so this endpoint is browser-reachable for free).
- Added `frontend/api/storage.ts` + `frontend/hooks/use-resolved-image-url.ts` (a `useQuery` wrapper, `STALE_TIME.LONG` — comfortably inside the backend's 1-hour presigned URL expiry).
- `ResolvedImage` now tries the synchronous direct-URL path first (unchanged, still needs a public bucket), then falls back to the new async endpoint — so a future public-CDN deployment still gets a zero-latency path, and today's private-bucket deployment gets a real image instead of a placeholder.
- **Found the same `img-src`-vs-`connect-src` gap a second time**, this time in `img-src`: `next.config.mjs`'s CSP had `img-src` hardcoded to `'self' data: blob: https:`, never wired to the storage origin at all (unlike `connect-src`, already fixed in item 5b) — and `https:` doesn't match `http://localhost:9000` regardless (scheme mismatch). Fixed the same way: `img-src` now includes the storage origin when configured.
- Added a `QueryClientProvider` decorator to `.storybook/preview.tsx` — `ResolvedImage` now calls a TanStack Query hook, and no story had a provider in context before this.
- Added a `StorageService.get_download_url` unit test (`tests/unit/test_storage_abstraction.py`), matching the file's existing `InMemoryObjectStorage` fake pattern.
- Verified with a real Playwright browser test: real login, navigate to `/shopper/wardrobe`, assert the rendered `<img>`'s `naturalWidth` is nonzero (i.e. the browser actually decoded real image bytes, not just that an `<img>` tag with *some* `src` exists) — `704`, confirming a real photo rendered.

### 6. (High) `next build` failed outright — two pages missing `"use client"`

**Files:** `frontend/features/brand/components/customers/customers-view.tsx`, `frontend/features/brand/components/orders/orders-view.tsx`

`npm run build` (never run in any prior phase — required Node) failed prerendering `/brand/customers`:

```
Error: Functions cannot be passed directly to Client Components unless you explicitly
expose it by marking it with "use server".
```

Both files render `<RequireStore>{() => (...)}</RequireStore>` — a render-prop pattern — but `RequireStore` is a Client Component and neither `customers-view.tsx` nor `orders-view.tsx` had a `"use client"` directive. A Server Component can't pass a function as `children` to a Client Component; every *other* view using `RequireStore` had the directive, these two didn't.

**Fix:** Added `"use client"` to both files. `npm run build` now succeeds, generating all 50 routes.

### 7. (High) Infinite loading/error loop on the Body Profile page

**Files:** `frontend/features/shopper/components/body-profile-view.tsx`, `frontend/features/shopper/components/body-profile-form.tsx`

For a shopper with no body profile yet (`GET /users/me/body-profile` → 404), the page never settled — it cycled `loading → error(missing) → loading → error(missing) → ...` forever, confirmed via live console instrumentation (`status`/`fetchStatus` bouncing indefinitely). Root cause: `BodyProfileView` and its child `BodyProfileForm` both independently called `useBodyProfile()`. When the parent resolved to the 404/"missing" state it mounted the form, whose *own* call to the same query registered a new observer against an already-errored query — which TanStack Query's default `refetchOnMount` refetches. That refetch flipped the parent back to `isLoading`, which unmounted the form (removing the observer), which let the query resolve to error again, remounting the form — a self-sustaining loop.

**Fix:** `BodyProfileForm` no longer calls `useBodyProfile()` itself. `BodyProfileView` (which already has the data) now passes it down as an `existingProfile` prop. Only one observer subscribes to the query; the loop is structurally impossible now, not just less likely.

### 8. (Medium) A real, un-audited WCAG 2.1 AA contrast failure

**Files:** `frontend/app/globals.css`, `frontend/config/tokens/colors.ts`, and 7 component files

Once axe-core could actually run (it never had before — Playwright/Node again), it found the `--primary` brass color (`34 45% 48%`), used directly as link text color (`text-primary`) on the page background, has a 3.22:1 contrast ratio — below WCAG AA's 4.5:1 for normal text. `docs/frontend/ACCESSIBILITY_AUDIT.md` from Phase 2.6 had claimed a clean audit; that claim was based on manual review only, since automated scanning was never actually executable.

A second, distinct violation surfaced once the first was fixed: three inline links (in `/about`, `/privacy`, `/terms`) relied on `hover:underline` only, with no visible-at-rest distinguishing feature from the surrounding paragraph text (WCAG 1.4.1, "Use of Color").

**Fix:** Added a `--primary-text` token (same hue, `34 45% 38%` in light mode — 4.82:1 contrast; dark mode's `--primary` already passes at 8.29:1 as-is, so `--primary-text` just equals `--primary` there). Swapped every standalone-text `text-primary` usage (auth form links, the `Button` `link` variant, three marketing-page links) to `text-primary-text`. The three inline links additionally got a persistent `underline` instead of `hover:underline`. Left two decorative/large-text usages (`logo.tsx`'s bullet, the homepage hero span) untouched — they didn't fail the actual axe scan, and changing them would be an unproven, unrequested visual change. All 10 scanned pages (7 public + 3 auth) now pass with zero violations.

---

## Configuration/tooling gaps found and fixed (not runtime bugs, but would have caused real problems)

- **No `.dockerignore` anywhere in the repo.** `docker build` for the frontend sent the entire directory — including the 954 MB `node_modules` created by this validation pass — as build context (852 MB transferred every build). Added `.dockerignore` to `backend/`, `ai-service/`, and `frontend/`. Frontend build context dropped from 852 MB to 34.6 KB.
- **ESLint/Prettier lint the Storybook build output.** `npm run build-storybook` had never been run; once it was, `eslint .` picked up the generated `storybook-static/` bundle (minified JS, thousands of false lint errors). Added `storybook-static/**` to both `eslint.config.mjs` and `.prettierignore` — it was already in `.gitignore`, just not the lint configs.
- **118 files failed `npm run format:check`.** Every frontend file from Phases 2.1–2.6 was hand-authored without ever running Prettier (no Node available then). Ran `npm run format` once; all changes are whitespace/quote-style only, verified via a full re-run of lint/typecheck/tests afterward.
- **2 TypeScript errors** (`body-profile-form.tsx`, `step-style-preferences.tsx`): `StylePreferences.preferred_fit` is typed as plain `string | null`, wider than the form schema's literal union. Fixed with the same `as` cast pattern already used for the adjacent `favorite_colors`/`style_preferences` fields.
- **2 unit test failures** from a genuine upstream API addition: `@tanstack/react-query` 5.101.2 (within the pinned `^5.62.7` range) now calls `mutationFn(variables, context)` with a second argument real code ignores but `toHaveBeenCalledWith` doesn't. Narrowed both assertions to check only the first argument.
- **CI's `docker-build-check` job has been broken since Phase 2.6.** `docker-compose.prod.yml` requires `env_file: .env.production` to exist on disk; the CI step only set process env vars via `env:`, never created the file. `docker compose config` fails hard (exit 14) when an `env_file` target is missing, regardless of what's in `env:`. Reproduced locally, fixed by adding `cp .env.production.example .env.production` before the validation step in `.github/workflows/ci.yml`.
- **`version: "3.9"` in all three Compose files** — obsolete in Compose v2.29, printed a warning on every single command. Removed (cosmetic only, but noisy).

---

## Commands run (exact, for reproducibility)

```bash
# Environment setup (one-time, sandbox-local, not committed)
curl -fsSL https://nodejs.org/dist/v20.20.2/node-v20.20.2-linux-x64.tar.xz | tar xJ -C ~/.local/opt
curl -fsSL https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-x86_64 \
  -o ~/.docker/cli-plugins/docker-compose && chmod +x ~/.docker/cli-plugins/docker-compose

# Backend
cd backend && uv venv .venv && uv pip install -r requirements.txt -r ../requirements-dev.txt
.venv/bin/ruff check app tests && .venv/bin/black --check app tests && .venv/bin/isort --check-only app tests
.venv/bin/mypy --config-file=../pyproject.toml app
.venv/bin/python -m pytest tests/unit -m unit -q
DATABASE_URL=postgresql+psycopg2://fitmirror:fitmirror@localhost:15432/fitmirror_test \
  .venv/bin/python -m pytest tests/integration -m integration -q

# AI service — same pattern, cd ai-service

# Frontend
cd frontend && npm install
npm run typecheck && npm run lint && npm run format:check
npm run test
npm run build
npm run build-storybook
npx playwright install chromium
npx playwright test --project=chromium --workers=4

# Docker
cp .env.dev.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml build
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
docker compose exec minio mc alias set local http://localhost:9000 fitmirror fitmirror123
docker compose exec minio mc mb local/fitmirror-media
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.db.seed

# make targets
make lint && make typecheck && make test-frontend
make seed && make migrate
```

## Services tested

Postgres 16, Redis 7, MinIO, ai-service (FastAPI), backend (FastAPI), worker (Celery), frontend (Next.js dev server) — all 7 containers reach `healthy` from a clean `docker compose up`.

## Endpoints tested (20/20 pass — see `docs/SMOKE_TESTS.md` for the full script and expected responses)

`GET /health`, `GET /api/v1/health` (AI service), `POST /auth/register` (×2 roles + duplicate-email conflict), `POST /auth/login` (×2 roles), `GET /users/me`, `GET`/`PUT /users/me/body-profile`, `POST /store`, `GET /store/me`, `GET /store/me/summary`, `POST`/`GET /store/products`, `POST /tryon/upload-url`, `POST /tryon`, `GET /tryon/{id}`, `GET /tryon`, `POST`/`GET`/`DELETE /wardrobe`.

## Frontend routes tested

`/`, `/login`, `/register`, `/shopper`, `/shopper/body-profile` (`/shopper/profile`), `/shopper/try-on` (`/shopper/tryon`), `/shopper/wardrobe`, `/brand`, `/brand/products`, `/brand/products/new`, `/admin`, `/admin/users`, `/admin/stores`, `/admin/tryon-jobs`, `/admin/system-health` — plus every other public/auth/shopper/brand/admin route via the 58-test Playwright suite and manual `curl`-based route-gating checks (unauthenticated → `/login`, wrong-role → `/unauthorized`, logged-in visiting `/login` → role home).

## Next recommended actions

See `docs/KNOWN_ISSUES.md` for the full list. Highest-value follow-ups, in order:
1. Adopt `S3_PUBLIC_ENDPOINT_URL` in the production deployment guide (`docs/DEPLOYMENT_FRONTEND.md`/`DEPLOYMENT.md`) if production ever fronts MinIO/S3 behind a different internal-vs-external hostname than assumed there.
2. Add a CI job that actually runs `docker compose up` and hits `/health` on every service — every bug in this report except the a11y/lint ones would have been caught by that on the very first PR that introduced it, rather than surfacing three phases later.
3. Consider wiring `webkit`/`mobile-safari` into whatever CI runner is used, or drop it from `playwright.config.ts`'s `projects` if it's not meant to be exercised — right now it's configured but neither installed by `make test-frontend-e2e`'s documented flow nor covered by CI.
