# API Contract Documentation

This is the authoritative, exhaustive endpoint-by-endpoint contract. For
request/response JSON *examples*, see the root-level `API_CONTRACTS.md`
(kept as a lighter-weight companion). For system design context, see
`ARCHITECTURE.md`. For the shared envelope shapes referenced below (error
object, pagination, job status), see `RESPONSE_STANDARDS.md`.

Base URL: `/api/v1` (backend). Interactive docs: `/docs`.

Columns: **Auth** = `none` | `bearer` (any authenticated user) |
`bearer:shopper` / `bearer:brand_admin` / `bearer:platform_admin` (role
required in addition to authentication — see `RBAC.md` for the full matrix;
today's role checks are ownership-based, not decorator-enforced — see the
note at the bottom of this file).

## Auth

| Endpoint | Method | Auth | Request Body | Success | Error Responses |
|---|---|---|---|---|---|
| `/auth/register` | POST | none | `{email, password, full_name?}` | `201` `UserRead` | `409 CONFLICT`, `422 VALIDATION_ERROR` |
| `/auth/login` | POST | none | `{email, password}` | `200` `TokenResponse` | `401 AUTH_INVALID_CREDENTIALS` |
| `/auth/refresh` | POST | none (refresh token in body) | `{refresh_token}` | `200` `TokenResponse` | `401 AUTH_TOKEN_EXPIRED` |

## Users

| Endpoint | Method | Auth | Request Body | Success | Error Responses |
|---|---|---|---|---|---|
| `/users/me` | GET | bearer | — | `200` `UserRead` | `401`, `404 USER_NOT_FOUND` |
| `/users/me/body-profile` | GET | bearer | — | `200` `BodyProfileRead` | `401`, `404 BODY_PROFILE_MISSING` |
| `/users/me/body-profile` | PUT | bearer | `BodyProfileUpsert` (all fields optional) | `200` `BodyProfileRead` | `401`, `422 VALIDATION_ERROR` |

## Smart Wardrobe

| Endpoint | Method | Auth | Request Body | Success | Error Responses |
|---|---|---|---|---|---|
| `/wardrobe` | POST | bearer | `{source, category, label?, image_key, product_variant_id?}` | `201` `WardrobeItemRead` | `401`, `422 VALIDATION_ERROR` |
| `/wardrobe` | GET | bearer | — | `200` `WardrobeItemRead[]` | `401` |
| `/wardrobe/{item_id}` | DELETE | bearer | — | `204` empty | `401`, `404 WARDROBE_ITEM_NOT_FOUND` |

## Virtual Try-On

| Endpoint | Method | Auth | Request Body | Success | Error Responses |
|---|---|---|---|---|---|
| `/tryon/upload-url` | POST | bearer | query params `filename`, `content_type` | `200` `{object_key, upload_url, expires_in_seconds}` | `401`, `502 STORAGE_UPLOAD_FAILED` |
| `/tryon/download-url` | GET | bearer | query param `object_key` | `200` `{download_url}` | `401`, `502 STORAGE_DOWNLOAD_FAILED` |
| `/tryon` | POST | bearer | `{user_image_key, garment_image_key?, product_variant_id?}` | `202` `{job_id, status: "pending"}` | `401`, `404 PRODUCT_NOT_FOUND` (bad `product_variant_id`), `422 VALIDATION_ERROR` (neither image nor variant given) |
| `/tryon/{job_id}` | GET | bearer | — | `200` `TryOnJobRead` | `401`, `404 TRYON_JOB_NOT_FOUND` |
| `/tryon` | GET | bearer | — | `200` `TryOnJobRead[]` | `401` |

`TryOnJobRead.status` can be `pending`/`processing`/`completed`/`failed`; a
`failed` job is still a `200` response (the job resource exists and is
readable) — `TRYON_JOB_FAILED` as an error code applies to *actions that
require a completed job* (e.g. a planned "promote to Saved Look" endpoint
would 409 with `TRYON_JOB_FAILED` if attempted on a failed job).

## AI Stylist, Size Recommendation, Shopping Assistant

*Contracts reserved, not implemented — see `ROADMAP.md` Phases 3/4/5.*

| Endpoint | Method | Auth | Request Body | Current Response | Planned Response |
|---|---|---|---|---|---|
| `/stylist/suggestions` | POST | bearer | `{occasion?, weather?}` | `501` | `200 {suggestion_id, wardrobe_item_ids, rationale}` |
| `/sizing/recommend` | POST | bearer | `{product_id}` | `501` | `200 {product_id, recommended_size_label, confidence}` |
| `/shopping/ask` | POST | bearer | `{query}` | `501` | `200 {matched_product_ids, reply}` |

## Store Dashboard

| Endpoint | Method | Auth | Request Body | Success | Error Responses |
|---|---|---|---|---|---|
| `/store` | POST | bearer:brand_admin | `{name, slug}` | `201` `StoreRead` | `401`, `409 CONFLICT` (slug taken), `422 VALIDATION_ERROR` |
| `/store/me` | GET | bearer:brand_admin | — | `200` `StoreRead` | `401`, `404 STORE_NOT_FOUND` |
| `/store/me/summary` | GET | bearer:brand_admin | — | `200` `StoreDashboardSummary` | `401`, `404 STORE_NOT_FOUND` |
| `/store/products` | POST | bearer:brand_admin | `ProductCreate` | `201` `ProductRead` | `401`, `404 STORE_NOT_FOUND`, `422 VALIDATION_ERROR` |
| `/store/products` | GET | bearer:brand_admin | — | `200` `ProductRead[]` | `401`, `404 STORE_NOT_FOUND` |

`bearer:brand_admin` here means "authenticated AND owns a store for
write/summary operations" — see the RBAC enforcement note below.

## AI Service (internal only — never called directly by clients)

| Endpoint | Method | Auth | Request Body | Success | Error Responses |
|---|---|---|---|---|---|
| `/api/v1/health` | GET | none (internal network only) | — | `200 {status, service, active_model}` | — |
| `/api/v1/tryon/generate` | POST | none (internal network only) | `{job_id, user_image_key, garment_image_key}` | `200 {job_id, result_image_key, model_name}` | `500 AI_GENERATION_FAILED` |

The AI service has no user-facing auth today — it's reachable only inside
the Docker/orchestrator network (`AI_SERVICE_BASE_URL` is never exposed
publicly; see `SECURITY.md`).

## Status code conventions

| Code | Meaning here |
|---|---|
| `200` | Successful read, or a successful write that returns the full resource synchronously |
| `201` | Resource created |
| `202` | Accepted for async processing (try-on job creation only) |
| `204` | Successful delete, no body |
| `401` | Missing/invalid/expired token, or wrong credentials |
| `403` | Authenticated but not permitted (role/ownership check failed) — see `RBAC.md` |
| `404` | Resource doesn't exist, or exists but isn't owned by the caller (ownership-scoped 404s are intentional — see `SECURITY.md` on not leaking existence) |
| `409` | Conflict (duplicate email, duplicate slug) |
| `422` | Request body failed validation (Pydantic) |
| `429` | Rate limited (placeholder — see `SECURITY.md`) |
| `500` | Unhandled internal error |
| `501` | Contract exists, feature not implemented yet (Stylist/Sizing/Shopping only) |
| `502` | A downstream dependency (object storage, AI service) failed |

## RBAC enforcement note (current implementation reality)

As of Phase 1.75, endpoint-level role enforcement is **ownership-based**,
not a generic `@require_role(...)` decorator: e.g. `/store/*` endpoints
don't check `user.role == brand_admin` explicitly — they check "does a
store exist owned by this user_id", which has the same practical effect
(a `shopper` has no store, so gets `404 STORE_NOT_FOUND`) but is worth
knowing when reasoning about edge cases (a `platform_admin` calling
`/store/me` without owning a store also gets `404`, not `403`). See
`RBAC.md` for the target permission matrix and where a real role-check
layer is planned.
