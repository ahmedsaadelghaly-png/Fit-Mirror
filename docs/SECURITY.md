# Security Policy

Consolidates the security posture already implemented across Phase 1/1.5,
plus explicitly planned hardening. Cross-references `DEPLOYMENT.md`'s
pre-launch secrets checklist, which operationalizes several items below.

## JWT

- **Algorithm:** HS256 (`JWT_ALGORITHM`), symmetric signing via
  `JWT_SECRET_KEY`. Implemented in `app/core/security.py`.
- **Token types:** `access` (default 60 min, `ACCESS_TOKEN_EXPIRE_MINUTES`)
  and `refresh` (default 7 days, `REFRESH_TOKEN_EXPIRE_MINUTES`), each
  carrying a `type` claim checked on decode (`decode_token(token,
  expected_type=...)`) — an access token cannot be used where a refresh
  token is expected, and vice versa.
- **Claims:** `sub` (user id), `type`, `iat`, `exp`, plus `role` on access
  tokens (used for the current ownership-based checks — see `RBAC.md`).
- **Secret rotation:** not yet implemented — a `JWT_SECRET_KEY` change
  invalidates every outstanding token immediately (no grace period /
  dual-key verification). **Planned:** support a list of valid signing
  keys with a rotation window, so an old key can still verify
  already-issued tokens for some period after rotating to a new one.
- **Storage:** tokens are bearer tokens returned in the JSON body, not set
  as cookies — the client (once a frontend exists) is responsible for
  storage; this document doesn't prescribe `localStorage` vs. a secure
  cookie since no frontend exists yet to make that call concrete.

## Password hashing

- **Algorithm:** bcrypt via `passlib.CryptContext`, configurable cost
  factor (`BCRYPT_ROUNDS`, default `12`) — see `app/core/security.py`.
  `bcrypt` is pinned to `4.0.1` in `requirements.txt` for compatibility
  with the installed `passlib` version (see `CONTRIBUTING.md` for why this
  pin matters if either dependency is ever bumped).
- Hashed passwords are never included in any API response
  (`UserRead` schema deliberately omits `hashed_password`).
- No password complexity rules beyond a minimum length (8 characters,
  `RegisterRequest.password: Field(min_length=8)`) are enforced today.
  **Planned:** evaluate whether additional rules (breached-password
  checking via a service like HaveIBeenPwned's k-anonymity API) are worth
  the added friction before public launch.

## Rate limiting

- **Implemented as a placeholder**, not production-ready:
  `RateLimitMiddleware` (`app/core/middleware.py`), gated by
  `RATE_LIMIT_ENABLED` (default `false`), with a per-client (by IP)
  in-process counter and `RATE_LIMIT_REQUESTS_PER_MINUTE` threshold. On
  exceeding the threshold: `429` with `error_code: "rate_limited"` and a
  `Retry-After: 60` header.
- **Known limitation, explicitly documented:** the counter is per-process
  memory — it does **not** share state across multiple backend
  replicas/workers. Running `docker-compose.prod.yml`'s `backend`
  service with `replicas: 2` means each replica enforces its own
  independent limit, effectively multiplying the real ceiling. This is
  acceptable for Phase 1.75 (single-instance dev/staging), **not**
  acceptable once horizontal scaling is real — see `DEPLOYMENT.md`'s
  secrets checklist and `ROADMAP.md` Phase 8.
- **Planned:** a Redis-backed sliding-window or token-bucket limiter
  (shared state across replicas), likely keyed by user id for
  authenticated endpoints (fairer than IP-based, which penalizes shared
  NAT/corporate networks) and by IP for unauthenticated endpoints
  (`/auth/login`, `/auth/register`, where there's no user id yet).

## Image privacy

- All user-uploaded images (photos, garment images, wardrobe uploads) are
  referenced only by object storage key in the database — never embedded
  as binary blobs in Postgres (see `STORAGE.md`).
- Read access to a private image is via a **pre-signed, time-limited
  URL** (`generate_download_url`, 1 hour expiry) — never a permanently
  public URL, unless `S3_PUBLIC_BASE_URL` is explicitly configured (which
  should only ever point at genuinely public content, e.g. product catalog
  images meant to be publicly browsable — never `user-photos/` or
  `tryon-results/`).
- **No endpoint lets one user read another user's private images** — see
  `MULTI_TENANCY.md` "User data isolation". A `tryon_jobs` row (and its
  `user_image_key`/`result_image_key`) is only ever returned to its owning
  `user_id`; `TryOnService.get_job` raises `NotFoundError` (not
  `ForbiddenError`) for a different user's job id — see the 404-vs-403
  rationale below.
- **Planned:** explicit content moderation on uploaded photos (nothing
  today rejects inappropriate uploads) — deferred until there's a
  frontend actually accepting uploads from the public, since it's not
  useful to design in isolation from the actual upload UX.

## Signed URL expiry

| Purpose | Expiry | Rationale |
|---|---|---|
| Upload URL (`generate_upload_url`) | 15 minutes | Long enough for a normal upload over a slow connection, short enough to limit exposure if a URL is somehow leaked (e.g. logged, screenshotted) |
| Download URL (`generate_download_url`) | 1 hour | Balances not re-requesting a URL on every page view against not leaving a long-lived link valid indefinitely |

Both are defined as constants in `app/services/storage_service.py`
(`UPLOAD_URL_EXPIRY`, `DOWNLOAD_URL_EXPIRY`) — not currently
environment-configurable. **Planned:** make these configurable per
environment if a real deployment needs different values (e.g. a stricter
upload window in production than in dev).

## CORS

- Configured via `CORS_ORIGINS` (`app/core/config.py`), applied through
  FastAPI's `CORSMiddleware` in `app/main.py`.
- **Dev/test defaults:** `["*"]` — deliberately permissive since no
  frontend origin is fixed yet.
- **Production requirement (enforced by policy, not by code):**
  `.env.production.example` documents `CORS_ORIGINS` as an explicit
  allow-list (`["https://app.fitmirror.ai","https://fitmirror.ai"]`), and
  `DEPLOYMENT.md`'s secrets checklist calls out `CORS_ORIGINS` must not be
  `["*"]` before go-live. There is currently no code-level guard that
  *prevents* deploying with `CORS_ORIGINS=["*"]` in production — this is a
  process control, not a technical one. **Planned:** a startup check that
  refuses to boot with `ENVIRONMENT=production` and `CORS_ORIGINS=["*"]`
  simultaneously.

## Request validation

- Every request body is validated by a Pydantic schema
  (`app/schemas/`) before reaching service code — invalid payloads never
  reach business logic; FastAPI returns `422` automatically (see
  `RESPONSE_STANDARDS.md` §4 for the current/planned shape).
- Path/query parameters are typed (e.g. `job_id: uuid.UUID` in endpoint
  signatures) — a malformed UUID in the URL is rejected before the
  endpoint body executes, not after a failed database lookup.
- **Planned:** centralized request size limits (e.g. reject an
  unreasonably large JSON body before parsing) — not configured today
  beyond FastAPI/Starlette's defaults.

## Role checks

See `RBAC.md` for the full permission matrix and current
ownership-based enforcement reality, and the planned `require_role(...)`
dependency for explicit role gating once `platform_admin`-only endpoints
are built.

## Data retention policy

| Data category | Current retention | Planned |
|---|---|---|
| User accounts | Until deleted. `POST /users/me/delete` starts a 30-day grace period (`ACCOUNT_DELETION_GRACE_DAYS`); logging in cancels it. Then the account's images and row are erased, cascading per `ERD.md`. A brand's store stays visible during the grace period. | — |
| Try-on jobs and their images (`user-photos/`, `tryon-results/`) | 90 days (`TRYON_RETENTION_DAYS`), unless saved as a look. A photo also used by another try-on, a profile or a wardrobe item is kept. | Saved looks have no limit yet; uploads never attached to anything aren't swept |
| Audit logs [planned] | N/A — not implemented yet | Longer than user data, per `AUDIT_LOGGING.md` — exact duration is an open compliance question, not yet decided |
| Application logs | Whatever the log aggregator's retention is configured to (infrastructure-level, not application-level) | No change planned — this is intentionally an ops/infra concern, not application code |

Retention runs daily at 03:00 UTC (`maintenance.apply_data_retention`, needs
the `beat` service; see `app/services/data_retention_service.py`). The 90- and
30-day periods are product defaults that legal review should confirm; a draft
policy is in `docs/legal/PRIVACY_POLICY_DRAFT.md`.

This table intentionally states "not yet decided" rather than inventing
specific retention periods without legal/compliance input — a real
retention policy should be set by whoever owns that decision for the
business, not defaulted silently in a technical document.

## Children's data

Children's profiles (`girls`/`boys`) get size recommendations only. They can't
hold a reference photo, and try-on is refused for those profiles and for
children's products, so their photos aren't sent to a third-party model. This
stays until legal review says otherwise. A shopper can still upload a child's
photo as their own; the software can't detect that.

## Why 404 instead of 403 for cross-tenant/cross-user access

Referenced from `API_CONTRACTS.md` and `RBAC.md`: when a caller requests a
resource that exists but isn't theirs (another user's `tryon_jobs` row,
another store's product), the API returns `404 Not Found`, not
`403 Forbidden`. This is deliberate: a `403` confirms the resource exists
(just not accessible to you), which is itself information disclosure in a
multi-tenant system (e.g. "this `job_id` exists, someone just isn't
telling me whose it is" narrows an attacker's guesswork). Returning `404`
in both the "doesn't exist" and "exists but not yours" cases gives no such
signal.
