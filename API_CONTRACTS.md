# API Contracts

> See also: `docs/API_CONTRACTS.md` for the exhaustive endpoint-by-endpoint
> table (auth requirements, every status/error code per endpoint). This
> file focuses on concrete request/response JSON examples.

Detailed request/response contracts for every endpoint. For a one-line
summary table of all endpoints, see `ARCHITECTURE.md` §5. Base URL for the
backend: `http://localhost:8000/api/v1` (dev). Interactive docs (always the
source of truth): `http://localhost:8000/docs`.

All authenticated endpoints require `Authorization: Bearer <access_token>`.

## Auth

### `POST /auth/register`
```json
// Request
{ "email": "user@example.com", "password": "min8chars", "full_name": "Ada Shopper" }

// 201 Response
{ "id": "uuid", "email": "user@example.com", "full_name": "Ada Shopper", "role": "shopper", "is_active": true }

// 409 if email already registered: { "error_code": "conflict", "message": "..." }
```

### `POST /auth/login`
```json
// Request
{ "email": "user@example.com", "password": "min8chars" }

// 200 Response
{ "access_token": "...", "refresh_token": "...", "token_type": "bearer" }

// 401 on bad credentials or inactive account
```

### `POST /auth/refresh`
```json
// Request
{ "refresh_token": "..." }

// 200 Response — same shape as /auth/login
```

## Users

### `GET /users/me` → `200` `UserRead` (see register response shape)

### `GET /users/me/body-profile`
```json
// 200 Response
{ "id": "uuid", "height_cm": 170, "weight_kg": 65, "chest_cm": 92, "waist_cm": 76, "hip_cm": 98, "body_shape": "rectangle", "reference_image_key": null }
// 404 if never set
```

### `PUT /users/me/body-profile`
```json
// Request — all fields optional, only provided ones are updated
{ "height_cm": 170, "weight_kg": 65, "body_shape": "rectangle" }
// 200 Response — same shape as GET
```

## Smart Wardrobe

### `POST /wardrobe`
```json
// Request
{ "source": "uploaded", "category": "tops", "label": "Blue hoodie", "image_key": "user-photos/u1/hoodie.jpg" }
// source: "uploaded" | "catalog"; if "catalog", include product_variant_id

// 201 Response
{ "id": "uuid", "source": "uploaded", "category": "tops", "label": "Blue hoodie", "image_key": "user-photos/u1/hoodie.jpg" }
```

### `GET /wardrobe` → `200` array of the above shape

### `DELETE /wardrobe/{item_id}` → `204` empty body, or `404` if not found/not owned

## Virtual Try-On

### `POST /tryon/upload-url`
Query params: `filename`, `content_type`.
```json
// 200 Response
{ "object_key": "user-photos/<user_id>/9f2a3c_photo.jpg", "upload_url": "https://...", "expires_in_seconds": 900 }
```
Client then `PUT`s the raw file bytes directly to `upload_url` with header
`Content-Type: <content_type>`.

### `POST /tryon`
```json
// Request — either garment_image_key OR product_variant_id is required
{ "user_image_key": "user-photos/u1/photo.jpg", "garment_image_key": "garments/g1.jpg" }
// or:
{ "user_image_key": "user-photos/u1/photo.jpg", "product_variant_id": "uuid-of-variant" }

// 202 Response — non-blocking, job runs async
{ "job_id": "uuid", "status": "pending" }

// 422 if neither garment_image_key nor product_variant_id given
// 404 if product_variant_id doesn't exist
```

### `GET /tryon/{job_id}`
```json
// 200 Response (while processing)
{ "id": "uuid", "status": "processing", "user_image_key": "...", "garment_image_key": "...", "result_image_key": null, "ai_model_name": null, "error_message": null }

// 200 Response (completed)
{ "id": "uuid", "status": "completed", "user_image_key": "...", "garment_image_key": "...", "result_image_key": "tryon-results/abc.png", "ai_model_name": "placeholder-v0", "error_message": null }

// 200 Response (failed)
{ "id": "uuid", "status": "failed", "...": "...", "error_message": "..." }

// 404 if job doesn't exist or belongs to another user
```
Poll this endpoint until `status` is `completed` or `failed`. Recommended
poll interval: 2s, with backoff.

### `GET /tryon` → `200` array of the job shape above, newest first, for the current user

## AI Stylist, Size Recommendation, Shopping Assistant

Rule-based v1 engines — full status/error table in `docs/API_CONTRACTS.md`.

### `POST /stylist/suggestions`
```json
// Request
{ "occasion": "Job interview", "weather": "cold" }
// 200 Response
{ "suggestion_id": "uuid", "wardrobe_item_ids": ["uuid", "uuid", "uuid", "uuid"],
  "rationale": "For Job interview in cooler weather, try White Oxford Shirt, Navy Trousers, Brown Loafers with Wool Blazer." }
```

### `POST /sizing/recommend`
```json
// Request
{ "product_id": "uuid" }
// 200 Response
{ "product_id": "uuid", "recommended_size_label": "M", "confidence": 0.95,
  "fit_note": "Your measurements fall within M on our size chart." }
// 422 if the body profile lacks the measurements this category needs
```

### `POST /shopping/ask`
```json
// Request
{ "query": "black jacket under $100 in size M" }
// 200 Response
{ "matched_product_ids": ["uuid"],
  "reply": "I found 1 match (outerwear, in size M, under $100): Classic Bomber Jacket — USD 89.00." }
```

### `GET /catalog/products?ids=<uuid>&ids=<uuid>` → `200` array of `ProductRead` (active only, in `ids` order)

## Store Dashboard

### `POST /store`
```json
// Request
{ "name": "Demo Fashion Co.", "slug": "demo-fashion-co" }
// 201 Response
{ "id": "uuid", "name": "Demo Fashion Co.", "slug": "demo-fashion-co", "logo_image_key": null, "is_verified": false }
// 409 if slug taken
```

### `GET /store/me` → `200` same shape as above, `404` if the account has no store yet

### `GET /store/me/summary`
```json
{ "total_products": 3, "total_tryon_jobs": 12, "completed_tryon_jobs": 10, "failed_tryon_jobs": 1 }
```

### `POST /store/products`
```json
// Request
{ "title": "Classic Cotton T-Shirt", "category": "tops", "price": 24.99, "currency": "USD" }
// 201 Response
{ "id": "uuid", "title": "...", "description": null, "category": "tops", "price": "24.99", "currency": "USD", "primary_image_key": null, "is_active": true, "variants": [] }
```

### `GET /store/products` → `200` array of the above shape (with `variants` populated)

### `PATCH /store/products/{id}` → `200` product; body is any subset of `ProductCreate` plus `is_active`

### `DELETE /store/products/{id}` → `204`

### `POST /store/products/{id}/variants`
```json
// Request
{ "size_label": "M", "color": "White", "sku": "TSHIRT-WHT-M", "stock_quantity": 50 }
// 201 Response
{ "id": "uuid", "size_label": "M", "color": "White", "sku": "TSHIRT-WHT-M", "stock_quantity": 50, "garment_image_key": null }
// 409 if the SKU is already used
```

### `PATCH` / `DELETE /store/products/{id}/variants/{variant_id}` → `200` variant / `204`

All `/store/*` endpoints require role `brand_admin` or `platform_admin` (`403` otherwise).

## Platform Admin (`platform_admin` only)

`GET /admin/stats`, `GET /admin/users`, `PATCH /admin/users/{id}`
(`{role?, is_active?}`), `GET /admin/stores`, `PATCH /admin/stores/{id}`
(`{is_verified}`), `GET /admin/tryon-jobs` — see `docs/API_CONTRACTS.md`
"Platform Admin" for filters and response shapes.

## AI Service (internal — called by the Celery worker, not by clients)

Base URL: `http://ai-service:8001/api/v1` inside the compose network.

### `GET /health`
```json
{ "status": "ok", "service": "FitMirror AI Service", "active_model": "placeholder" }
```

### `POST /tryon/generate`
```json
// Request
{ "job_id": "uuid-as-string", "user_image_key": "user-photos/u1/photo.jpg", "garment_image_key": "garments/g1.jpg" }

// 200 Response
{ "job_id": "uuid-as-string", "result_image_key": "tryon-results/abc123.png", "model_name": "placeholder-v0" }

// 500 on pipeline failure — the backend worker interprets this as a
// retryable/failable job event (see ARCHITECTURE.md §6)
```

## Error shape (all endpoints, backend)

```json
{ "error_code": "not_found", "message": "Try-on job not found." }
```

`error_code` values in use: `not_found`, `validation_error`, `unauthorized`,
`forbidden`, `conflict`, `external_service_error`, `internal_error`. See
`app/core/exceptions.py` for the full hierarchy and HTTP status mapping.

## Correlation

Every response includes an `X-Request-ID` header (generated if the client
didn't send one). Include it when reporting bugs — it's tagged onto every
log line for that request in both services.
