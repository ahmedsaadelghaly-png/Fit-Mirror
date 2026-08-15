# Audit Logging Design

## Current state

No `audit_logs` table, model, or write path exists yet — this is a
**planned** capability. Today, the only trail of system activity is
application logs (stdout, structured via `app/core/logging_config.py`,
tagged with `request_id` — see `DEVELOPMENT.md`), which are useful for
debugging but not queryable/retained the way a real audit trail needs to
be (they're ephemeral unless a log aggregator is configured, and they're
not modeled as first-class, per-entity event rows).

## Schema (planned — see `ERD.md` for the full column list)

```
audit_logs
├── id (PK, uuid)
├── actor_user_id (FK -> users.id, nullable — null for system events)
├── event_type (string, indexed)   e.g. "user.login", "product.updated"
├── entity_type (string)            e.g. "product", "store", "tryon_job"
├── entity_id (uuid, nullable)
├── before_state (JSON, nullable)   omitted for pure events like login
├── after_state (JSON, nullable)
├── ip_address (string, nullable)
└── created_at (timestamptz)        no updated_at — rows are immutable
```

Append-only by design: no `UPDATE`/`DELETE` code path should ever touch an
`audit_logs` row once written. Ownership/visibility rules are covered in
`MULTI_TENANCY.md` ("Audit log ownership").

## Event catalog (planned)

### Login events
| `event_type` | Trigger | `before_state`/`after_state` |
|---|---|---|
| `user.login.success` | `POST /auth/login` succeeds | none (pure event) |
| `user.login.failure` | `POST /auth/login` fails (bad credentials or inactive account) | none — log the attempted email, not the password, ever |
| `user.token.refresh` | `POST /auth/refresh` succeeds | none |

### Profile changes
| `event_type` | Trigger | State captured |
|---|---|---|
| `user.registered` | `POST /auth/register` | `after_state`: `{email, role}` (never `hashed_password`) |
| `body_profile.updated` | `PUT /users/me/body-profile` | `before_state`/`after_state`: changed measurement fields only |

### Store changes
| `event_type` | Trigger | State captured |
|---|---|---|
| `store.created` | `POST /store` | `after_state`: `{name, slug}` |
| `store.verified` | Planned admin verification workflow flips `is_verified` | `before_state: {is_verified: false}`, `after_state: {is_verified: true}` |

### Product changes
| `event_type` | Trigger | State captured |
|---|---|---|
| `product.created` | `POST /store/products` | `after_state`: full product payload |
| `product.updated` | Planned `PUT /store/products/{id}` | diffed fields only |
| `product.deleted` | Planned `DELETE /store/products/{id}` | `before_state`: full product payload |

### Try-on job events
| `event_type` | Trigger | State captured |
|---|---|---|
| `tryon_job.created` | `POST /tryon` | `after_state`: `{product_variant_id, user_image_key, garment_image_key}` |
| `tryon_job.completed` | Worker marks job `completed` | `after_state`: `{result_image_key, ai_model_name}` |
| `tryon_job.failed` | Worker marks job `failed` | `after_state`: `{error_message}` |

These three are logged with `actor_user_id = null` when written by the
Celery worker (a system actor), and with the requesting user's id only for
`tryon_job.created` (a direct user action).

### Admin actions
| `event_type` | Trigger | State captured |
|---|---|---|
| `admin.user.deactivated` | Planned admin endpoint | `before_state`/`after_state`: `{is_active}` |
| `admin.store.suspended` | Planned admin endpoint | `before_state`/`after_state`: `{is_verified}` or a future `is_suspended` |
| `admin.feature_flag.overridden` | Planned admin flag override (see `FEATURE_FLAGS.md`) | `before_state`/`after_state`: flag name + value |
| `admin.user_data.accessed` | Planned — any time a `platform_admin` reads another user's private data (wardrobe, body profile, try-on jobs) via a planned admin endpoint | `after_state`: `{accessed_entity_type, accessed_entity_id}` — logged specifically **because** it's a privacy-sensitive isolation override (see `MULTI_TENANCY.md`) |

## Write path (planned)

A lightweight helper, called from services (not endpoints directly, to
keep the pattern consistent with the existing `api → services →
repositories` layering):

```python
# Planned: app/services/audit_service.py
class AuditService:
    def __init__(self, db: Session):
        self.db = db

    def record(
        self,
        *,
        actor_user_id: uuid.UUID | None,
        event_type: str,
        entity_type: str,
        entity_id: uuid.UUID | None = None,
        before_state: dict | None = None,
        after_state: dict | None = None,
        ip_address: str | None = None,
    ) -> None:
        self.db.add(AuditLog(...))
        self.db.commit()
```

- Called at the end of the relevant service method, after the primary
  operation's own commit succeeds — an audit-write failure should be
  logged (application logs) but should **not** roll back or fail the
  primary operation. Audit logging is observability, not a transactional
  guarantee the user-facing action depends on.
- `ip_address` is sourced from the request (planned: read from
  `request.client.host`, consistent with how `RateLimitMiddleware`
  already reads it — see `SECURITY.md`).

## Retention

See `SECURITY.md` "data retention policy" for the platform-wide stance.
Audit logs specifically: **retained longer than most user data**, since
their entire purpose is historical accountability — even if a user's
account and personal data (wardrobe, try-on jobs) are deleted, the audit
trail of *actions taken* (e.g. `user.login.failure` attempts, or an
admin's `admin.user_data.accessed` event) should persist per whatever
compliance window the business ultimately requires. Exact retention
duration is **not yet decided** — flagged here as an open question rather
than inventing a number without legal/compliance input.
