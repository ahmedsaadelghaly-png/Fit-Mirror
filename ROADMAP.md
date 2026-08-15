# FitMirror AI — Development Roadmap

Phase 1 (backend + AI-service skeleton), Phase 1.5 (production tooling),
Phase 1.75 (system design documentation — see `docs/`), Phase 2.1
(frontend foundation), and Phase 2.2 (real authentication, API
integration, public pages, theme tokens, Storybook — see
`docs/frontend/`) are complete. Proposed scope for subsequent phases:

## Phase 2.3 — Shopper/Brand/Admin Dashboard Build-Out
- Shopper: real wardrobe CRUD UI, try-on upload + job creation + status
  polling UI (backend already supports all of this — see backend
  `docs/API_CONTRACTS.md`)
- Brand: real product/variant management UI, store dashboard summary
  wired to `GET /store/me/summary`
- Admin: no backend admin endpoints exist yet (see backend
  `docs/RBAC.md`) — this phase likely starts with backend admin
  endpoints, then the UI
- Real forgot-password backend endpoint, replacing the frontend's
  documented placeholder adapter (`frontend/features/auth/api.ts`)
- Real contact-form backend endpoint, replacing
  `frontend/features/contact/api.ts`'s placeholder adapter
- Remove `comingSoon` flags in `frontend/config/navigation.ts` as each
  route ships

## Phase 3 — AI Stylist
- Implement `/stylist/suggestions` for real (currently `501`)
- Rule-based or embedding-based outfit matching from wardrobe items
- Occasion/weather-aware recommendations (weather API integration)
- Feedback loop (like/dislike) to personalize future suggestions

## Phase 4 — Size Recommendation Engine
- Implement `/sizing/recommend` for real (currently `501`)
- Per-brand size chart ingestion (Store Dashboard extension)
- Body-profile-to-size-chart matching algorithm
- Confidence scoring and "fits big/small" feedback collection

## Phase 5 — Shopping Assistant
- Implement `/shopping/ask` for real (currently `501`)
- Natural-language product search over the catalog
- Conversational cart-building, integrate with try-on and sizing
- Personalized recommendations using wardrobe + purchase history

## Phase 6 — Real Virtual Try-On Model
- Replace `PlaceholderTryOnPipeline` with a production-grade model
  (e.g. diffusion-based virtual try-on) behind the existing
  `TryOnPipeline` interface — no API or schema changes required
- GPU-backed deployment/autoscaling for the AI service
- Model versioning, A/B testing support via the model registry
- Quality/safety filtering on generated images

## Phase 7 — Store Dashboard Expansion
- Analytics: try-on conversion rates, popular products, size-fit reports
- Bulk product/variant import (CSV, catalog API integration)
- Team management (multiple brand_admin users per store)
- Billing/subscription tier for brand accounts

## Phase 8 — Platform Hardening
- Rate limiting, API key management for brand integrations
- Observability: metrics (Prometheus), tracing, structured log aggregation
- CI/CD pipelines, staging environment, automated migration checks
- Load testing for the async try-on pipeline; queue autoscaling policy
- Security review: JWT rotation, RBAC refinement, PII/image data handling
  and retention policy

Each phase should extend, not restructure, the Phase 1 architecture: new
features plug into the existing `api → services → repositories → models`
layering, and new AI capabilities plug into the existing pipeline/registry
pattern established for virtual try-on.
