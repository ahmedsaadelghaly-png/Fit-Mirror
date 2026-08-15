# Naming Conventions

Documents the conventions already in consistent use across the codebase,
so new code (by any contributor, human or AI-assisted) matches existing
patterns rather than introducing a new style per file.

## Files & modules

- Python files/modules: `snake_case.py` — e.g. `tryon_service.py`,
  `model_registry.py`, `base_pipeline.py`.
- One primary concept per file where practical, named after that concept
  (`auth_service.py` contains `AuthService`, not also `WardrobeService`).
- Test files: `test_<thing_under_test>.py`, mirroring the source module
  name where there's a 1:1 relationship (`test_auth_service.py` tests
  `auth_service.py`) — see `TESTING.md`.
- Documentation files: `UPPER_SNAKE_CASE.md` at both repo root and in
  `docs/` (`ARCHITECTURE.md`, `docs/ERD.md`) — distinguishes docs from
  code at a glance in directory listings.

## Modules (package structure)

- Layer-named packages, matching Clean Architecture layering documented in
  `ARCHITECTURE.md`: `api/`, `services/`, `repositories/`, `models/`,
  `schemas/`, `storage/`, `workers/`, `core/`.
- `api/v1/endpoints/<feature>.py` — one file per feature area (`auth.py`,
  `wardrobe.py`, `tryon.py`), not one giant `routes.py`.

## Classes

- `PascalCase`, no prefix/suffix noise beyond what clarifies role:
  - ORM models: bare noun — `User`, `Store`, `Product`, `TryOnJob`
    (not `UserModel`/`UserEntity`).
  - Pydantic schemas: `<Noun><Purpose>` — `UserRead`, `ProductCreate`,
    `TryOnJobCreate`, `TokenResponse`. Suffix indicates direction/purpose:
    `Read` (API response), `Create` (creation request), `Upsert`
    (create-or-update request), `Response`/`Request` for auth-flow-specific
    shapes that don't map 1:1 to a table.
  - Services: `<Noun>Service` — `AuthService`, `WardrobeService`,
    `TryOnService`, `StorageService`.
  - Repositories: `<Noun>Repository` — `UserRepository`,
    `TryOnJobRepository`, extending `BaseRepository[ModelType]`.
  - Exceptions: `<Condition>Error` — `NotFoundError`, `ConflictError`,
    `ValidationAppError` (named `...AppError` specifically to avoid
    colliding with Pydantic's own `ValidationError`).
  - Enums: `<Noun>` or `<Noun><Aspect>` — `UserRole`, `TryOnJobStatus`,
    `WardrobeItemSource`. Enum *values* are lowercase strings matching the
    database enum labels (`UserRole.SHOPPER = "shopper"`).
  - AI service pipelines: `<Model><Purpose>Pipeline` —
    `PlaceholderTryOnPipeline`; future: `DiffusionTryOnPipeline`.

## Services

- Business-logic classes take their dependencies (repositories, other
  services, the storage interface) via constructor injection, e.g.
  `TryOnService(repository: TryOnJobRepository)` — never instantiate a
  repository/storage implementation internally, always receive it (see
  `ARCHITECTURE.md`'s dependency-injection principle).
- A service method name is a verb phrase describing the business action,
  not the underlying query: `create_job`, `authenticate`, `issue_tokens` —
  not `insert_row` or `run_query`.

## Repositories

- One repository per aggregate root (`UserRepository`, not a
  `UserProfileRepository` separate from `UserRepository` — `BodyProfile`
  is accessed through direct queries in the endpoint/service today rather
  than its own repository, since it's a simple 1:1 extension; revisit if
  its query complexity grows).
- Repository methods are named for what they return/do, not generic CRUD
  verbs alone where a more specific name adds clarity:
  `list_for_user(user_id)`, `get_by_email(email)`, `set_status(job,
  status, ...)` — versus the inherited generic `get`/`add`/`update`/
  `delete` from `BaseRepository` for the common cases.

## Schemas

- Grouped by feature area, matching `api/v1/endpoints/`:
  `schemas/auth.py`, `schemas/wardrobe.py`, `schemas/tryon.py`, etc.
- Field names match the underlying ORM column name exactly where a schema
  wraps a model 1:1 (`UserRead.email` ↔ `User.email`) — no gratuitous
  renaming between the API and database layers.

## API routes

- All routes under `/api/v1`, grouped by feature: `/auth/*`, `/users/*`,
  `/wardrobe/*`, `/tryon/*`, `/stylist/*`, `/sizing/*`, `/shopping/*`,
  `/store/*`.
- Route path segments are **plural nouns** for collections
  (`/wardrobe`, `/tryon`, i.e. treated as the collection name even where
  the underlying concept could be phrased as singular — consistency
  across the API matters more than singular/plural purism here) and the
  singular resource is addressed by appending an id:
  `/tryon/{job_id}`, `/wardrobe/{item_id}`.
- Actions that don't map to a CRUD verb use a trailing verb segment:
  `/tryon/upload-url`, `/stylist/suggestions`, `/shopping/ask`,
  `/sizing/recommend` — kebab-case for multi-word segments
  (`upload-url`, not `upload_url` or `uploadUrl`), matching REST URL
  convention even though the rest of the codebase is `snake_case` Python.

## Database tables

- `snake_case`, plural: `users`, `body_profiles`, `product_variants`,
  `wardrobe_items`, `tryon_jobs`. Planned tables follow the same rule:
  `saved_looks`, `recommendations`, `audit_logs`.
- Foreign key columns: `<singular_referenced_table>_id` —
  `user_id`, `store_id`, `product_id`, `product_variant_id`. Exception:
  `stores.owner_user_id` (not `user_id`) — named for its *role*
  (the owning user), not just its target table, since a future
  `store_members` table (planned, see `MULTI_TENANCY.md`) will have
  its own `user_id` with a different role meaning (`member_role`).
- Enum type names (Postgres `CREATE TYPE`, via SQLAlchemy's
  `Enum(..., name=...)`): `<column_name_singular>` —
  `user_role`, `tryon_job_status`, `wardrobe_item_source`.
- Timestamp columns: always `created_at`/`updated_at` (via the shared
  `TimestampMixin`), never `date_created`/`modified_at`/other variants.
- Primary keys: always `id` (UUID, via `UUIDPrimaryKeyMixin`), never a
  table-prefixed `user_id` as the *primary* key of `users` itself.

## Environment variables

- `UPPER_SNAKE_CASE`, grouped by prefix matching their domain:
  - `JWT_*` — `JWT_SECRET_KEY`, `JWT_ALGORITHM`.
  - `S3_*` — `S3_ENDPOINT_URL`, `S3_ACCESS_KEY`, `S3_BUCKET_NAME`.
  - `CELERY_*` — `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`.
  - `RATE_LIMIT_*` — `RATE_LIMIT_ENABLED`, `RATE_LIMIT_REQUESTS_PER_MINUTE`.
  - `FEATURE_*` — planned flags, see `FEATURE_FLAGS.md`
    (`FEATURE_AI_STYLIST_ENABLED`, etc.).
- Boolean flags always end in a clear on/off word, not an ambiguous noun:
  `DEBUG`, `RATE_LIMIT_ENABLED`, `SECURE_HEADERS_ENABLED` — not `RATE_LIMIT`
  alone (which reads ambiguously as either a boolean or a numeric limit).
- Every environment variable maps to exactly one `Settings` field
  (`app/core/config.py`) with the identical name — no aliasing/renaming
  between the `.env` file and the Pydantic settings model.
