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

## Done — Visual redesign & body types

- Real photography across the public site and dashboards (Unsplash
  License, credited in `docs/frontend/ASSETS.md`); photographed demo
  catalog in the seed
- Body profile categories (women, men, girls, boys) with illustrated
  body-shape / kids' fit-type pickers; product `audience`; kids' sizing by
  height; shape-aware fit tips; audience-aware Shopping Assistant

## Done — Phase 3.2: Remaining backend gaps

- ✅ Family profiles: several body profiles per account (the shopper plus
  e.g. each child), chosen per size check and try-on
- ✅ Catalog try-on: Shop page → size for anyone in the family → try on a
  product variant; try-on jobs carry product, size and date
- ✅ Saved Looks (`saved_looks` table + `GET/POST/DELETE /saved-looks`)
- ✅ Style preferences (fit / colors / tags) and reference photo on the body
  profile; the AI Stylist favours the shopper's colours
- ✅ Store business info (category, description, social links, logo) via
  `PATCH /store/me`
- ✅ Password reset by email (`/auth/forgot-password`, `/auth/reset-password`),
  plus change password and edit name in Settings; a reset/change signs out
  other sessions at their next refresh. Email via SMTP or, in dev, the log
- ✅ Contact form → support inbox (`/admin/support`), forwarded to support email
- ✅ Self-service brand sign-up ("I'm a brand" on Register)
- ✅ Batch download URLs (`POST /storage/download-urls`): the web app batches
  every image on screen into one request instead of one per image

Still mocked after Phase 3 (each needs its own backend model, see Phase 5–6):
Admin product moderation, queue/worker monitoring, AI telemetry, feature
flags, audit log and reports; Brand analytics, customers and orders;
notification preferences; account deletion.

## Done — Phase 4: Real AI models (same contracts)

Each model switches on with configuration (`REPLICATE_*`, `VOYAGE_API_KEY`,
`ANTHROPIC_API_KEY` — see `docs/AI_INTERFACES.md`); without keys every
feature still works on its built-in fallback.

- ✅ Virtual try-on: IDM-VTON diffusion try-on on Replicate's GPUs behind the
  same contract (`TRYON_MODEL_ROUTES`), pinned model versions recorded per
  job, weighted A/B routing, input/output quality gates, pluggable safety
  check, automatic fallback to the placeholder; rejected photos fail fast
  with a reason instead of being retried
- ✅ Stylist: embeddings (local hashing, or Voyage AI) for occasion fit and
  item compatibility; like/dislike feedback trains a per-shopper taste
  vector, item affinity and pairing model that carries over to similar
  pieces
- ✅ Sizing: per-brand size charts (CSV or rows, per category; Brand
  "Size Charts" page) used whenever their labels match; shopper "runs
  small / true to size / runs large" feedback shifts recommendations one
  size once ≥3 reports agree ≥60%, and brands see the summary per product
- ✅ Shopping: Claude query understanding (structured outputs, synonyms for
  recall, refusal fallbacks; rules when unavailable) and embedding-ranked
  catalog search

## Done — Privacy and data protection

- ✅ File access checks: a stored file can only be read by its uploader, the
  owner of the try-on it belongs to, a platform admin, or anyone if it's
  published on the catalog (`app/services/storage_access.py`)
- ✅ Account deletion with a 30-day grace period; logging in cancels
- ✅ Try-ons and their photos deleted after 90 days unless saved
- ✅ Failed try-ons show an honest error; no placeholder fallback by default
- ✅ Children's profiles are size-only: no photos, no photo try-on
- Before launch: legal review of `docs/legal/PRIVACY_POLICY_DRAFT.md`, then
  publish the policy and terms; data export

## Phase 5 — Store Dashboard expansion

- Analytics: try-on conversion, popular products, size-fit reports
- Bulk product/variant import (CSV, catalog API)
- Team management (multiple brand users per store — see `docs/MULTI_TENANCY.md`)
- Billing / subscription tiers

## Phase 6 — Platform hardening

- Redis-backed rate limiter (the in-process one is per-instance)
- Real audit log + feature flag backends (`docs/AUDIT_LOGGING.md`, `docs/FEATURE_FLAGS.md`)
- Metrics (Prometheus), tracing, log aggregation; staging environment
- Load testing the try-on pipeline; queue autoscaling
- JWT rotation / refresh-token revocation
- Replace `passlib` (Python 3.13 `crypt` removal — see `docs/KNOWN_ISSUES.md`)

Each phase extends, not restructures, the existing architecture: features
plug into `api → services → repositories → models`, and AI capabilities
plug into the pipeline/registry pattern (or a service behind an unchanged
endpoint contract).
