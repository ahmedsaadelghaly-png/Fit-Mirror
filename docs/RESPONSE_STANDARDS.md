# Response Standards

Canonical response shapes used across the backend. `ERROR_CODES.md` has the
full code catalog; this file defines the *envelope* each response type uses.

## 1. Success response format

Resource endpoints return the resource directly (no wrapper envelope) —
this matches the current implementation (`UserRead`, `TryOnJobRead`, etc.
are returned as-is by FastAPI/Pydantic):

```json
{
  "id": "b3f1c2e4-...",
  "email": "shopper@example.com",
  "full_name": "Ada Shopper",
  "role": "shopper",
  "is_active": true
}
```

List endpoints return a bare JSON array today (`GET /wardrobe`,
`GET /tryon`, `GET /store/products`):

```json
[
  { "id": "...", "...": "..." },
  { "id": "...", "...": "..." }
]
```

> **Planned:** once list endpoints need pagination (see §3), they'll move
> to the paginated envelope below. This is a **breaking change** tracked
> under `API_VERSIONING.md`'s deprecation policy — today's bare-array
> endpoints will keep working until a `v2` cutover, not change silently
> under `v1`.

## 2. Error response format

Every error from the backend's domain-exception handler
(`app/core/exceptions.py` + the FastAPI exception handler in
`app/main.py`) uses this shape:

```json
{
  "error_code": "not_found",
  "message": "Try-on job not found."
}
```

- `error_code` is a stable, machine-readable string — see `ERROR_CODES.md`
  for the full catalog and HTTP status mapping.
- `message` is human-readable and safe to display, but not guaranteed to
  be stable wording — clients should branch on `error_code`, not on
  `message` text.
- Pydantic validation errors (`422`) currently return FastAPI's default
  shape (see §4) rather than this envelope — see the note in §4 about
  planned unification.
- The `501` stub endpoints (Stylist/Sizing/Shopping) currently return
  FastAPI's default `HTTPException` shape (`{"detail": "..."}`), not this
  envelope, since they're raised directly as `HTTPException` rather than
  through the `AppError` hierarchy. **Planned:** migrate these to a
  dedicated `NotImplementedError` subclass of `AppError` for consistency.

## 3. Pagination format (planned)

No endpoint is paginated today — every list is small and scoped (a user's
own wardrobe, a store's own products). This is the target shape once
pagination is needed (e.g. a public product catalog browse endpoint):

```json
{
  "items": [ { "...": "..." } ],
  "page": 1,
  "page_size": 20,
  "total_items": 137,
  "total_pages": 7,
  "has_next": true,
  "has_previous": false
}
```

Request-side, via query params: `?page=1&page_size=20`. The
`app/schemas/common.py::Pagination` schema already exists as the
request-side building block; the response envelope above is planned.

## 4. Validation error format

Today (unchanged from FastAPI's default), a `422` looks like:

```json
{
  "detail": [
    {
      "type": "string_too_short",
      "loc": ["body", "password"],
      "msg": "String should have at least 8 characters",
      "input": "short",
      "ctx": { "min_length": 8 }
    }
  ]
}
```

**Planned:** normalize this into the same `error_code`/`message` envelope
as other errors, with per-field detail preserved under a `fields` key:

```json
{
  "error_code": "validation_error",
  "message": "Request validation failed.",
  "fields": [
    { "field": "password", "message": "String should have at least 8 characters" }
  ]
}
```

This is a deliberate near-term inconsistency, called out explicitly rather
than silently left undocumented — tracked for the same pass that
introduces the pagination envelope, since both are "touch every list/error
consumer" changes best done together.

## 5. Job status response format

Applies to `tryon_jobs` today, and to any future async-job resource
(recommendations generation, bulk product import, etc. — planned):

```json
{
  "id": "b3f1c2e4-...",
  "status": "processing",
  "user_image_key": "user-photos/u1/photo.jpg",
  "garment_image_key": "garments/g1.jpg",
  "result_image_key": null,
  "ai_model_name": null,
  "error_message": null
}
```

Status values and their meaning (see `QUEUE_ARCHITECTURE.md` §"status
transition rules" for the full state machine):

| Status | `result_image_key` | `error_message` | Meaning |
|---|---|---|---|
| `pending` | `null` | `null` | Created, not yet picked up by a worker |
| `processing` | `null` | `null` | Worker has claimed the job, AI service call in flight |
| `completed` | populated | `null` | Terminal success state |
| `failed` | `null` | populated | Terminal failure state (retries exhausted or non-retryable error) |

Job creation itself returns a slimmer `202` envelope (not the full job
shape) since the client just needs the id to start polling:

```json
{ "job_id": "b3f1c2e4-...", "status": "pending" }
```

## Conventions summary

- All timestamps are ISO-8601 with timezone (`created_at`/`updated_at` on
  every table via `TimestampMixin`).
- All IDs are UUIDv4 strings.
- `null` is used for "not yet set" / "not applicable" — never an empty
  string or `0` as a stand-in for absence.
- Money values are strings in JSON (Pydantic `Decimal` serialization,
  e.g. `"price": "24.99"`) to avoid floating-point precision issues —
  clients must parse as decimal, not `parseFloat`.
