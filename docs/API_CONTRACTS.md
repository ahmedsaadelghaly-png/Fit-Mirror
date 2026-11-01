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
| `/auth/register` | POST | none | `{email, password, full_name?, account_type?: "shopper" \| "brand"}` (brand → `brand_admin`, who then creates an unverified store) | `201` `UserRead` | `409 CONFLICT`, `422 VALIDATION_ERROR` |
| `/auth/login` | POST | none | `{email, password}` | `200` `TokenResponse` | `401 AUTH_INVALID_CREDENTIALS` |
| `/auth/refresh` | POST | none (refresh token in body) | `{refresh_token}` | `200` `TokenResponse` | `401 AUTH_TOKEN_EXPIRED`; `401` for a token issued before the last password reset/change |
| `/auth/forgot-password` | POST | none | `{email}` | `202 {message}` — same answer whether or not the account exists; emails a single-use link to `{FRONTEND_BASE_URL}/reset-password?token=…`, valid `PASSWORD_RESET_EXPIRE_MINUTES` (30) | `422` |
| `/auth/reset-password` | POST | none | `{token, new_password}` (8–128 chars) | `200 {message}` | `422` (unknown, used or expired link; a new request invalidates older links) |

## Users

| Endpoint | Method | Auth | Request Body | Success | Error Responses |
|---|---|---|---|---|---|
| `/users/me` | GET | bearer | — | `200` `UserRead` | `401`, `404 USER_NOT_FOUND` |
| `/users/me` | PATCH | bearer | `{full_name}` | `200` `UserRead` | `401`, `422` |
| `/users/me/password` | POST | bearer | `{current_password, new_password}` | `200` `TokenResponse` (fresh tokens for this session; other sessions end at their next refresh) | `401`, `422` (wrong current password) |
| `/users/me/body-profile` | GET | bearer | — | `200` `BodyProfileRead` | `401`, `404 BODY_PROFILE_MISSING` |
| `/users/me/body-profile` | PUT | bearer | `BodyProfileUpsert` (all fields optional; omitted fields kept) | `200` `BodyProfileRead` | `401`, `422 VALIDATION_ERROR` |

Body profiles also carry style preferences — `preferred_fit` (`slim` |
`regular` | `relaxed` | `oversized`), `favorite_colors` and
`style_preferences` (string lists, ≤12 each) — and `reference_image_key`,
which must be an object key this account uploaded (`422` otherwise).

### Family profiles

An account holds several body profiles: exactly one **primary** (the
shopper's own — what `/users/me/body-profile` reads and writes) plus
family members, e.g. each child. `BodyProfileRead` carries `name` and
`is_primary`.

| Endpoint | Method | Auth | Request Body | Success | Error Responses |
|---|---|---|---|---|---|
| `/users/me/body-profiles` | GET | bearer | — | `200` `BodyProfileRead[]` (primary first) | `401` |
| `/users/me/body-profiles` | POST | bearer | `BodyProfileCreate` (`name` required + any upsert field) — the account's first profile becomes primary | `201` `BodyProfileRead` | `401`, `422` (invalid shape/category; more than 8 profiles) |
| `/users/me/body-profiles/{id}` | GET | bearer | — | `200` `BodyProfileRead` | `401`, `404` (not yours) |
| `/users/me/body-profiles/{id}` | PUT | bearer | `BodyProfileUpsert` (partial, incl. `name`) | `200` `BodyProfileRead` | `401`, `404`, `422` |
| `/users/me/body-profiles/{id}` | DELETE | bearer | — | `204` | `401`, `404`, `422` (primary profile) |

## Saved Looks

| Endpoint | Method | Auth | Request Body | Success | Error Responses |
|---|---|---|---|---|---|
| `/saved-looks` | GET | bearer | — | `200` `SavedLookRead[]` (newest first) | `401` |
| `/saved-looks` | POST | bearer | `{tryon_job_id, label?}` | `201` `SavedLookRead` (`result_image_key`, `garment_image_key` come from the job) | `401`, `404` (not your job), `409` (already saved), `422` (job not completed) |
| `/saved-looks/{id}` | DELETE | bearer | — | `204` | `401`, `404` |

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
| `/storage/download-urls` | POST | bearer | `{object_keys: string[]}` (1–100) | `200` `{download_urls: {key: url}}` — one entry per distinct key | `401`, `422`, `502 STORAGE_DOWNLOAD_FAILED` |
| `/tryon` | POST | bearer | `{user_image_key, garment_image_key?, product_variant_id?}` — a catalog try-on sends the variant; its garment image (or the product photo) is used | `202` `{job_id, status: "pending"}` | `401`, `404 PRODUCT_NOT_FOUND` (unknown variant, or its product isn't visible to shoppers), `422 VALIDATION_ERROR` (neither image nor variant given) |
| `/tryon/{job_id}` | GET | bearer | — | `200` `TryOnJobRead` | `401`, `404 TRYON_JOB_NOT_FOUND` |
| `/tryon` | GET | bearer | — | `200` `TryOnJobRead[]` | `401` |

`TryOnJobRead` also carries `created_at` and, for catalog try-ons,
`product_variant_id`, `product_title` and `size_label`. `GET /tryon` is
newest first.

`TryOnJobRead.status` can be `pending`/`processing`/`completed`/`failed`; a
`failed` job is still a `200` response (the job resource exists and is
readable) — `TRYON_JOB_FAILED` as an error code applies to *actions that
require a completed job* (`POST /saved-looks` answers `422` for a job
that hasn't completed).

## AI Stylist, Size Recommendation, Shopping Assistant

*Implemented as rule-based v1 engines (Phase 3 backend) — see
`ROADMAP.md` for the planned model-backed replacements, which keep these
contracts.*

| Endpoint | Method | Auth | Request Body | Success | Error Responses |
|---|---|---|---|---|---|
| `/stylist/suggestions` | POST | bearer | `{occasion?, weather?}` | `200 {suggestion_id, wardrobe_item_ids, rationale}` (empty wardrobe → `200` with empty `wardrobe_item_ids` and a rationale saying what to add); every suggestion is stored for feedback | `401`, `422` |
| `/stylist/suggestions/{id}/feedback` | POST | bearer | `{liked: bool}` (re-sending replaces it) | `204` — later suggestions learn from it | `401`, `404` (not your suggestion), `422` |
| `/sizing/recommend` | POST | bearer | `{product_id, body_profile_id?}` (a family profile; default: the shopper's own) | `200 {product_id, recommended_size_label, confidence, fit_note, body_profile_id, profile_name, size_chart: "brand"\|"standard", fit_feedback}` — the brand's own chart for the category when its labels match the product's; then, once ≥3 fit reports agree ≥60%, one stocked size up (runs small) or down (runs large), explained in `fit_note` — adult items from chest/waist/hip (+ a body-shape tip); girls'/boys' items from height against age (`6Y`, `6-7Y`) or height (`116`, `110-116`) labels, one size up for `plus`/`husky` fits | `401`, `404` (unknown/inactive product, or someone else's profile), `422` (missing measurements; footwear; kids' item with an adult profile or vice versa) |
| `/shopping/ask` | POST | bearer | `{query}` (1–500 chars) | `200 {matched_product_ids, reply}` — up to 10 IDs, best match first | `401`, `422` |

### Size charts & fit feedback (Phase 4)

| Endpoint | Method | Auth | Request Body | Success | Error Responses |
|---|---|---|---|---|---|
| `/sizing/feedback` | POST | bearer | `{product_id, size_label, fit: "small"\|"true_to_size"\|"large"}` — one verdict per shopper per product (re-sending replaces it) | `200 FitSummary {reports, small, true_to_size, large, runs}` | `401`, `404` (product not visible), `422` (size not stocked) |
| `/store/size-charts` | GET | bearer:brand_admin | — | `200 SizeChartRead[] {category, rows, updated_at}` | `401`, `403`, `404` |
| `/store/size-charts/{category}` | PUT | bearer:brand_admin | `{rows: [{size_label, chest_cm?, waist_cm?, hip_cm?, height_cm?}]}` (each `[min, max]` cm, smallest size first) **or** `{csv}` (`size,chest,waist,hip,height` header, `86-94` cells); category ∈ tops/outerwear/dresses/bottoms; replaces the existing chart | `200 SizeChartRead` | `401`, `403`, `404`, `422` (explains the bad line/column) |
| `/store/size-charts/{category}` | DELETE | bearer:brand_admin | — | `204` | `401`, `403`, `404` |
| `/store/products/{id}/fit-feedback` | GET | bearer:brand_admin | — | `200 FitSummary` | `401`, `403`, `404` |

## Body profile: category & shape

`GET/PUT /users/me/body-profile` carry `body_category` (`women` | `men` |
`girls` | `boys` | null) alongside `body_shape`. The shape must belong to
the category (`422` otherwise, or if a shape is sent with no category):

| `body_category` | `body_shape` values |
|---|---|
| `women` | `hourglass`, `pear`, `apple`, `rectangle`, `inverted_triangle` |
| `men` | `rectangle`, `triangle`, `inverted_triangle`, `oval`, `trapezoid` |
| `girls` | `slim`, `regular`, `plus` |
| `boys` | `slim`, `regular`, `husky` |

Changing only `body_category` clears a stored shape that doesn't belong to
the new category. Products carry `audience` (`women` | `men` | `girls` |
`boys` | `unisex`, default `unisex`) on create/update/read; the Shopping
Assistant understands audience words ("for my daughter", "men's", "kids").

## Contact

| Endpoint | Method | Auth | Request Body | Success | Error Responses |
|---|---|---|---|---|---|
| `/contact` | POST | none | `{name, email, message}` (message 10–2000 chars) | `201 {message}` — stored in the support inbox and forwarded to `SUPPORT_EMAIL` with Reply-To set to the sender | `422` |

Email delivery: `EMAIL_BACKEND=log` (default) writes each email to the
backend log instead of sending it; `EMAIL_BACKEND=smtp` sends through
`SMTP_HOST`. Emails go out after the request commits, so a mail-server
failure never fails the request.

## Catalog

| Endpoint | Method | Auth | Query | Success | Error Responses |
|---|---|---|---|---|---|
| `/catalog/products` | GET | bearer (any role, shopper-visible = active, not archived, store not suspended) | `ids` (repeatable, ≤50; result keeps this order), `category`, `audience` (`women`/`men`/`girls`/`boys`/`unisex`), `q`, `limit` (≤100, default 24), `offset` | `200` `ProductRead[]` — active products only | `401`, `422` |
| `/catalog/products/{id}` | GET | bearer (any role) | — | `200` `ProductRead` | `401`, `404` (unknown or inactive) |

## Store Dashboard

| Endpoint | Method | Auth | Request Body | Success | Error Responses |
|---|---|---|---|---|---|
| `/store` | POST | bearer:brand_admin | `{name, slug}` | `201` `StoreRead` | `401`, `403`, `409 CONFLICT` (slug taken, or account already has a store), `422 VALIDATION_ERROR` |
| `/store/me` | GET | bearer:brand_admin | — | `200` `StoreRead` | `401`, `403`, `404 STORE_NOT_FOUND` |
| `/store/me` | PATCH | bearer:brand_admin | `StoreUpdate`: any of `name`, `category`, `description`, `social_links {website, instagram, tiktok}`, `logo_image_key` (must be this account's upload) | `200` `StoreRead` | `401`, `403`, `404`, `422` |
| `/store/me/summary` | GET | bearer:brand_admin | — | `200` `StoreDashboardSummary` | `401`, `403`, `404 STORE_NOT_FOUND` |
| `/store/products` | POST | bearer:brand_admin | `ProductCreate` | `201` `ProductRead` | `401`, `403`, `404 STORE_NOT_FOUND`, `422 VALIDATION_ERROR` |
| `/store/products` | GET | bearer:brand_admin | — | `200` `ProductRead[]`, newest first | `401`, `403`, `404 STORE_NOT_FOUND` |
| `/store/products/{id}` | GET | bearer:brand_admin | — | `200` `ProductRead` | `401`, `403`, `404` |
| `/store/products/{id}` | PATCH | bearer:brand_admin | `ProductUpdate` (any subset, incl. `is_active`, `is_archived`) | `200` `ProductRead` | `401`, `403`, `404`, `422` |
| `/store/products/{id}` | DELETE | bearer:brand_admin | — | `204` (variants cascade) | `401`, `403`, `404` |
| `/store/products/{id}/variants` | POST | bearer:brand_admin | `{size_label, sku, color?, stock_quantity?, garment_image_key?}` | `201` `ProductVariantRead` | `401`, `403`, `404`, `409` (SKU in use), `422` |
| `/store/products/{id}/variants/{variant_id}` | PATCH | bearer:brand_admin | any subset of the above | `200` `ProductVariantRead` | `401`, `403`, `404`, `409`, `422` |
| `/store/products/{id}/variants/{variant_id}` | DELETE | bearer:brand_admin | — | `204` | `401`, `403`, `404` |

`bearer:brand_admin` means role `brand_admin` or `platform_admin`
(`403` otherwise), **and** every query is scoped to the caller's own
store — another store's product answers `404`, not `403`.

## Platform Admin

| Endpoint | Method | Auth | Request / Query | Success | Error Responses |
|---|---|---|---|---|---|
| `/admin/stats` | GET | bearer:platform_admin | — | `200 {users_by_role, active_users, total_stores, verified_stores, total_products, active_products, tryon_jobs_by_status}` | `401`, `403` |
| `/admin/users` | GET | bearer:platform_admin | `q` (email/name), `role`, `is_active`, `limit` (≤200), `offset` | `200` `AdminUserRead[]`, newest first | `401`, `403` |
| `/admin/users/{id}` | PATCH | bearer:platform_admin | `{role?, is_active?}` | `200` `AdminUserRead` | `401`, `403`, `404`, `422` (deactivating/demoting yourself) |
| `/admin/stores` | GET | bearer:platform_admin | `is_verified`, `limit`, `offset` | `200` `AdminStoreRead[]` (incl. `owner_email`, `product_count`) | `401`, `403` |
| `/admin/stores/{id}` | PATCH | bearer:platform_admin | `{is_verified?, is_suspended?}` | `200` `AdminStoreRead` | `401`, `403`, `404` |
| `/admin/tryon-jobs` | GET | bearer:platform_admin | `status`, `user_id`, `limit`, `offset` | `200` `AdminTryOnJobRead[]` (incl. `user_email`, `store_name` for catalog garments, image keys), newest first | `401`, `403` |
| `/admin/tryon-jobs/{id}/retry` | POST | bearer:platform_admin | — | `200` `AdminTryOnJobRead` (status `pending`, re-queued) | `401`, `403`, `404`, `422` (job isn't `failed`) |

Role and active-status changes take effect on the user's **next request**
for role-checked routes — `require_role` loads the user row rather than
trusting the token's `role` claim, so a deactivated user's unexpired
token stops working there immediately.
| `/admin/contact-messages` | GET | bearer:platform_admin | query `is_resolved?`, `limit`, `offset` | `200` `ContactMessageRead[]` (newest first) | `401`, `403` |
| `/admin/contact-messages/{id}` | PATCH | bearer:platform_admin | `{is_resolved}` | `200` `ContactMessageRead` | `401`, `403`, `404` |


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
| `502` | A downstream dependency (object storage, AI service) failed |

## RBAC enforcement note (current implementation reality)

Role checks are enforced by the `require_role(...)` dependency in
`app/core/dependencies.py` (the mechanism `RBAC.md` planned since Phase
1.75): `/store/*` requires `brand_admin` or `platform_admin`, `/admin/*`
requires `platform_admin`, and a wrong role gets `403`. Ownership is
still enforced separately by scoping every query to the caller's own
rows, so cross-tenant access answers `404`. Endpoints any signed-in user
may call (users/me, wardrobe, try-on, stylist, sizing, shopping, catalog)
check only authentication plus ownership.
