# FitMirror AI — Development Roadmap

## Done

| Phase | Scope |
|---|---|
| 1 – 1.75 | Backend + AI-service skeleton, production tooling, system design docs (`docs/`) |
| 2.1 – 2.6 | Next.js frontend: auth, public site, Shopper / Brand / Admin apps, production hardening (`docs/frontend/`) |
| 2.7 | Full-stack validation against a real running stack (`docs/VALIDATION_REPORT.md`) |
| 2.8 | Fashion-first visual redesign across every surface |
| **3.0 — Backend catch-up** | The backend now covers what the frontend was faking: |
| | • RBAC enforced via `require_role` (`/store/*` brand-only, `/admin/*` admin-only) |
| | • Product update/delete and variant CRUD (`/store/products/{id}[/variants]`) |
| | • Platform Admin API: stats, user role/activation, store verification, try-on job monitoring (`/admin/*`) |
| | • Catalog browse (`/catalog/products`) |
| | • AI Stylist, Size Recommendation, Shopping Assistant as rule-based v1 engines (were `501`) |
| | • Fixes: try-on jobs flipping to `failed` between worker retries; rate limiter never resetting; arbitrary upload content types; per-request storage-client construction; N+1/in-Python aggregation on the store dashboard |

## Done — Phase 3.1: Frontend swap-over

- Brand: product edit / archive / active toggle / variants call the real
  endpoints; the localStorage product overlay is gone. Archiving is a real
  `products.is_archived` column.
- Admin: Users, Stores, Try-On Jobs (and dashboard counts from them) call
  `/admin/*`; new store suspension (`stores.is_suspended`, hides the
  store's products from shoppers) and failed-job retry endpoints.
- Shopper: Shopping Assistant matches render as product cards with
  "Find my size"; stale "simulated" copy removed.
- Still mocked in Admin: product moderation, queue/workers, AI telemetry,
  feature flags, audit log, reports (need new backend models).

## Next — Phase 3.2: Remaining backend gaps

- Catalog try-on in the Shopper app (try on a product variant, with a size
  recommendation) — the backend already accepts `product_variant_id`
- Saved Looks (`saved_looks` table + `POST/GET/DELETE /saved-looks`) —
  needs a migration
- Style preferences (fit / colors / tags) on `BodyProfile` — needs a migration
- Store business info (category, description, social links, logo) — needs a migration
- `POST /auth/forgot-password` + reset flow (needs an email provider)
- `POST /contact` (needs an email provider or a support inbox table)
- Self-service brand sign-up (today brand accounts are provisioned by an
  admin via `PATCH /admin/users/{id}` or the seed script)
- Batch download URLs (`POST /storage/download-urls`) so image grids make
  one request instead of one per image

## Phase 4 — Real AI models (same contracts)

- Virtual try-on: replace `PlaceholderTryOnPipeline` with a diffusion-based
  model behind `TryOnPipeline`; GPU deployment; model versioning / A-B via
  the registry; quality and safety filtering
- Stylist: embedding-based item compatibility + feedback loop (like/dislike)
- Sizing: per-brand size chart ingestion; "fits big/small" feedback
- Shopping: LLM query understanding / embedding search over the catalog

## Phase 5 — Store Dashboard expansion

- Analytics: try-on conversion, popular products, size-fit reports
- Bulk product/variant import (CSV, catalog API)
- Team management (multiple brand users per store — see `docs/MULTI_TENANCY.md`)
- Billing / subscription tiers

## Phase 6 — Platform hardening

- Redis-backed rate limiter (the in-process one is per-instance)
- Object-key ownership checks on `GET /tryon/download-url` (`docs/STORAGE.md`)
- Real audit log + feature flag backends (`docs/AUDIT_LOGGING.md`, `docs/FEATURE_FLAGS.md`)
- Metrics (Prometheus), tracing, log aggregation; staging environment
- Load testing the try-on pipeline; queue autoscaling
- JWT rotation / refresh-token revocation; PII and image retention policy
- Replace `passlib` (Python 3.13 `crypt` removal — see `docs/KNOWN_ISSUES.md`)

Each phase extends, not restructures, the existing architecture: features
plug into `api → services → repositories → models`, and AI capabilities
plug into the pipeline/registry pattern (or a service behind an unchanged
endpoint contract).
