# Error Code Catalog

This catalog defines the **target** set of specific, machine-readable error
codes for the platform. Current implementation status is called out per
code — see the "Implementation status" column and the note at the bottom.

## Catalog

| Code | HTTP Status | Meaning | Triggered by |
|---|---|---|---|
| `AUTH_INVALID_CREDENTIALS` | 401 | Email/password combination is wrong | `POST /auth/login` |
| `AUTH_TOKEN_EXPIRED` | 401 | JWT access or refresh token is expired or malformed | Any authenticated endpoint; `POST /auth/refresh` |
| `USER_NOT_FOUND` | 404 | Referenced user does not exist | `GET /users/me` (edge case: token valid but user deleted) |
| `BODY_PROFILE_MISSING` | 404 | Shopper has no body profile yet | `GET /users/me/body-profile` |
| `STORE_NOT_FOUND` | 404 | Caller has no store, or referenced store doesn't exist | `GET /store/me`, `GET /store/me/summary`, `POST /store/products` |
| `PRODUCT_NOT_FOUND` | 404 | Referenced product or product variant doesn't exist | `POST /tryon` with a bad `product_variant_id` |
| `WARDROBE_ITEM_NOT_FOUND` | 404 | Referenced wardrobe item doesn't exist or isn't owned by the caller | `DELETE /wardrobe/{item_id}` |
| `TRYON_JOB_NOT_FOUND` | 404 | Referenced try-on job doesn't exist or isn't owned by the caller | `GET /tryon/{job_id}` |
| `TRYON_JOB_FAILED` | 409 | Action requires a completed job, but the job is in `failed` state | Planned: "promote to Saved Look" on a failed job |
| `STORAGE_UPLOAD_FAILED` | 502 | Object storage rejected or failed the pre-signed URL request | `POST /tryon/upload-url` |
| `AI_SERVICE_UNAVAILABLE` | 502 | The AI service is unreachable (connection refused/timeout) | Celery worker → AI service call (surfaces as job `status=failed`, not a direct API response) |
| `AI_GENERATION_FAILED` | 500 | The AI service reached the pipeline but it raised an error | `POST /api/v1/tryon/generate` (AI service internal); surfaces to clients as job `status=failed` |
| `VALIDATION_ERROR` | 422 | Request body failed schema validation | Any endpoint with a request body |
| `RATE_LIMITED` | 429 | Too many requests from this client | Any endpoint, when `RATE_LIMIT_ENABLED=true` |
| `INTERNAL_ERROR` | 500 | Unhandled/unexpected server error | Any endpoint (catch-all handler) |

## Implementation status

| Code | Status | Detail |
|---|---|---|
| `VALIDATION_ERROR` | **implemented** (as `validation_error`) | `ValidationAppError` in `app/core/exceptions.py` |
| `RATE_LIMITED` | **implemented** (as `rate_limited`) | Raised directly in `RateLimitMiddleware` (see `SECURITY.md`) |
| `INTERNAL_ERROR` | **implemented** (as `internal_error`) | Catch-all handler in `app/main.py` |
| `AUTH_INVALID_CREDENTIALS`, `AUTH_TOKEN_EXPIRED` | **implemented, but merged** | Both currently surface as the generic `unauthorized` code via `UnauthorizedError` — the catalog above documents the *target* split, not yet implemented as distinct codes |
| `USER_NOT_FOUND`, `BODY_PROFILE_MISSING`, `STORE_NOT_FOUND`, `PRODUCT_NOT_FOUND`, `WARDROBE_ITEM_NOT_FOUND`, `TRYON_JOB_NOT_FOUND` | **implemented, but merged** | All currently surface as the generic `not_found` code via `NotFoundError` — same 404 status, but the `error_code` string doesn't yet distinguish entity type |
| `TRYON_JOB_FAILED` | **planned** | No endpoint currently acts on a job's completion state as a precondition; applies once Saved Looks (planned) lands |
| `STORAGE_UPLOAD_FAILED`, `AI_GENERATION_FAILED` | **implemented, but merged** | Both currently surface as the generic `external_service_error` code via `ExternalServiceError` |
| `AI_SERVICE_UNAVAILABLE` | **implemented as a distinct failure path, but not a client-facing code** | Surfaces as `tryon_jobs.error_message` text (via the Celery task's exception handling — see `QUEUE_ARCHITECTURE.md`), not as an API error response, since the AI service is called by the worker, not by the client directly |

**Planned migration:** split `NotFoundError` and `UnauthorizedError` into
per-entity subclasses (e.g. `UserNotFoundError(NotFoundError)` with its own
`error_code = "USER_NOT_FOUND"`), and likewise split
`ExternalServiceError`. This is intentionally deferred past Phase 1.75 —
it's a mechanical, low-risk refactor of `app/core/exceptions.py` plus
updating each `raise` call site, better done as its own focused change
than bundled into a documentation phase.

## Code naming convention

- `UPPER_SNAKE_CASE`, `<DOMAIN>_<CONDITION>` shape (`AUTH_*`, `TRYON_JOB_*`,
  `STORAGE_*`, `AI_*`).
- Today's *implemented* codes are `lower_snake_case` generics
  (`not_found`, `unauthorized`, etc.) — this predates the catalog above.
  When the planned migration lands, implemented codes will switch to
  `UPPER_SNAKE_CASE` to match this catalog; that is itself a breaking
  change for any client branching on the current lowercase strings, and
  will go through the deprecation process in `API_VERSIONING.md`.

## Client guidance

- Always branch on `error_code`, never on `message` (message wording may
  change without notice; `error_code` values are the stable contract).
- Treat unrecognized `error_code` values as `INTERNAL_ERROR` — new codes
  may be added without a version bump (additive, non-breaking).
- `TRYON_JOB_NOT_FOUND` and `WARDROBE_ITEM_NOT_FOUND` are also returned
  when the resource exists but belongs to another user — this is
  intentional (see `SECURITY.md` on not leaking existence via 403 vs 404).
