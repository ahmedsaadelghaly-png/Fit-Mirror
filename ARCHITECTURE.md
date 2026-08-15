# FitMirror AI — Phase 1 Architecture

## 1. System Architecture Overview

FitMirror AI is split into two independently deployable services plus shared
infrastructure:

```
                        ┌───────────────────────┐
                        │   Client (mobile/web)  │
                        │  (built in a later      │
                        │   phase)                │
                        └───────────┬────────────┘
                                    │ REST / JWT
                                    ▼
                        ┌───────────────────────┐
                        │   Backend API          │
                        │   (FastAPI)            │
                        │  - Auth                │
                        │  - Users/BodyProfile   │
                        │  - Wardrobe            │
                        │  - Try-On job creation │
                        │  - Stylist/Sizing/     │
                        │    Shopping (stubs)    │
                        │  - Store Dashboard     │
                        └───┬───────────┬────────┘
                            │           │
                 enqueue    │           │ reads/writes
                 job        │           │
                            ▼           ▼
                 ┌─────────────────┐ ┌────────────┐
                 │  Redis (broker)  │ │ PostgreSQL │
                 └────────┬────────┘ └────────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │  Celery Worker   │
                 │  (backend image) │
                 └────────┬────────┘
                          │ HTTP call
                          ▼
                 ┌─────────────────┐        ┌──────────────┐
                 │   AI Service     │───────▶│ S3 / MinIO   │
                 │   (FastAPI)      │◀───────│ Object Store │
                 │  - Model registry│        └──────────────┘
                 │  - Pipelines     │
                 └─────────────────┘
```

Key properties:

- **Backend never runs AI inference.** It creates a job, enqueues it, and
  returns. A Celery worker calls the AI service over HTTP.
- **AI Service never touches PostgreSQL.** It only reads/writes object
  storage and returns storage keys. This keeps it stateless and horizontally
  scalable, and lets it be swapped, versioned, or GPU-scheduled independently.
- **Large binary data (photos) never transits through the database or the
  message broker** — only object storage keys do.
- **Both services share the same S3-compatible bucket**, addressed by key,
  so either side can read what the other wrote.

## 2. Microservices Architecture

| Service | Responsibility | Depends on |
|---|---|---|
| `backend` (FastAPI) | Auth, user/body profile, wardrobe, try-on job lifecycle, store/product CRUD, API contracts for Stylist/Sizing/Shopping (stubs in Phase 1) | PostgreSQL, Redis, Object Storage, AI Service (via HTTP, indirectly through worker) |
| `worker` (Celery, same codebase as backend) | Executes async try-on jobs: calls the AI service, updates job status | PostgreSQL, Redis, AI Service |
| `ai-service` (FastAPI) | Replaceable AI pipelines behind a stable HTTP contract; currently only a placeholder try-on pipeline | Object Storage |
| `postgres` | System of record | — |
| `redis` | Celery broker + result backend | — |
| `minio` (dev) / S3 (prod) | Object storage for photos, garment images, and generated results | — |

Each of `backend`, `worker`, and `ai-service` is independently deployable and
scalable (e.g. the worker or AI service can be scaled up during peak try-on
demand without scaling the API).

## 3. Repository Folder Structure

```
fitmirror-ai/
├── backend/
│   ├── app/
│   │   ├── main.py                 FastAPI entrypoint, exception handlers
│   │   ├── core/                   config, security (JWT), logging, DI, exceptions
│   │   ├── db/                     SQLAlchemy base, session, model aggregator
│   │   ├── models/                 SQLAlchemy ORM models (one file per aggregate)
│   │   ├── schemas/                Pydantic request/response models
│   │   ├── api/v1/endpoints/       Route handlers, one file per feature
│   │   ├── services/               Business logic (Clean Architecture layer)
│   │   ├── repositories/           Data access layer
│   │   ├── storage/                ObjectStorage interface + S3 implementation
│   │   └── workers/                Celery app + async tasks
│   ├── alembic/                    DB migrations
│   ├── requirements.txt
│   └── Dockerfile
├── ai-service/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/                   config, logging
│   │   ├── api/v1/endpoints/       tryon.py, health.py
│   │   ├── schemas/                request/response models
│   │   ├── pipelines/              TryOnPipeline interface + placeholder impl
│   │   ├── models/                 model_registry.py (swap point for real models)
│   │   └── storage/                minimal S3 client
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
├── README.md
├── ARCHITECTURE.md
└── ROADMAP.md
```

This follows Clean Architecture: `api` depends on `services`, `services`
depend on `repositories` and abstractions (`ObjectStorage`), `repositories`
depend on `models`. Nothing in `services` or `repositories` imports FastAPI.

## 4. PostgreSQL Database Schema

```
users
├── id (PK, uuid)
├── email (unique)
├── hashed_password
├── full_name
├── role (enum: shopper | brand_admin | platform_admin)
├── is_active
└── created_at / updated_at

body_profiles
├── id (PK, uuid)
├── user_id (FK -> users.id, unique, cascade delete)
├── height_cm, weight_kg, chest_cm, waist_cm, hip_cm
├── body_shape
├── reference_image_key
└── created_at / updated_at

stores
├── id (PK, uuid)
├── owner_user_id (FK -> users.id, unique, cascade delete)
├── name
├── slug (unique)
├── logo_image_key
├── is_verified
└── created_at / updated_at

products
├── id (PK, uuid)
├── store_id (FK -> stores.id, cascade delete)
├── title, description, category
├── price, currency
├── primary_image_key
├── is_active
└── created_at / updated_at

product_variants
├── id (PK, uuid)
├── product_id (FK -> products.id, cascade delete)
├── size_label, color, sku (unique)
├── stock_quantity
├── garment_image_key
└── created_at / updated_at

wardrobe_items
├── id (PK, uuid)
├── user_id (FK -> users.id, cascade delete)
├── source (enum: uploaded | catalog)
├── product_variant_id (FK -> product_variants.id, nullable, set null on delete)
├── category, label
├── image_key
└── created_at / updated_at

tryon_jobs
├── id (PK, uuid)
├── user_id (FK -> users.id, cascade delete)
├── product_variant_id (FK -> product_variants.id, nullable)
├── user_image_key, garment_image_key      (inputs — storage keys, not blobs)
├── status (enum: pending | processing | completed | failed)
├── ai_model_name                            which pipeline handled it
├── result_image_key                          output — storage key, nullable until completed
├── error_message                             populated only on failure
└── created_at / updated_at
```

Design notes:

- Every image field stores an **object storage key**, never binary data —
  keeping Postgres rows small and fast, and decoupling storage provider from
  schema.
- `tryon_jobs.status` is the backbone of the async flow and is indexed for
  fast polling/filtering.
- `ai_model_name` is recorded per job so results remain explainable/auditable
  even after the active model changes later.

## 5. REST API Endpoints (Backend, prefix `/api/v1`)

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create a shopper/brand account |
| POST | `/auth/login` | Exchange credentials for access + refresh tokens |
| POST | `/auth/refresh` | Exchange a refresh token for a new token pair |

### Users
| Method | Path | Description |
|---|---|---|
| GET | `/users/me` | Current user profile |
| GET | `/users/me/body-profile` | Get body measurements |
| PUT | `/users/me/body-profile` | Create/update body measurements |

### Smart Wardrobe
| Method | Path | Description |
|---|---|---|
| POST | `/wardrobe` | Add a wardrobe item (uploaded or from catalog) |
| GET | `/wardrobe` | List the current user's wardrobe |
| DELETE | `/wardrobe/{item_id}` | Remove a wardrobe item |

### Virtual Try-On
| Method | Path | Description |
|---|---|---|
| POST | `/tryon/upload-url` | Get a pre-signed URL to upload a photo |
| POST | `/tryon` | Create a try-on job (returns `202` + `job_id`, status=`pending`) |
| GET | `/tryon/{job_id}` | Poll job status/result |
| GET | `/tryon` | List the current user's try-on jobs |

### AI Stylist *(contract only — `501` in Phase 1)*
| Method | Path | Description |
|---|---|---|
| POST | `/stylist/suggestions` | Outfit suggestions from wardrobe + occasion/weather |

### Size Recommendation *(contract only — `501` in Phase 1)*
| Method | Path | Description |
|---|---|---|
| POST | `/sizing/recommend` | Recommended size for a given product |

### Shopping Assistant *(contract only — `501` in Phase 1)*
| Method | Path | Description |
|---|---|---|
| POST | `/shopping/ask` | Natural-language shopping query |

### Store Dashboard *(fully implemented — plain CRUD, no AI dependency)*
| Method | Path | Description |
|---|---|---|
| POST | `/store` | Register a store for the current (brand) user |
| GET | `/store/me` | Get the current user's store |
| GET | `/store/me/summary` | Dashboard metrics: product count, try-on job counts by status |
| POST | `/store/products` | Create a product |
| GET | `/store/products` | List the store's products |

### AI Service (internal, called by the Celery worker — not exposed to clients)
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/health` | Service + active-model health check |
| POST | `/api/v1/tryon/generate` | Runs the active pipeline for one job, returns a result image key |

## 6. Asynchronous Job Flow

```
1. Client -> POST /api/v1/tryon
2. Backend validates input, creates TryOnJob row (status=pending), commits
3. Backend calls process_tryon_job.delay(job_id) -> pushed to Redis queue
4. Backend responds 202 { job_id, status: "pending" }   <-- non-blocking

5. Celery worker picks up the task
6. Worker sets status=processing
7. Worker calls AI Service POST /api/v1/tryon/generate (job_id, image keys)
8. AI Service runs the active pipeline, writes result to object storage,
   returns { result_image_key, model_name }
9. Worker sets status=completed, stores result_image_key + ai_model_name

   On any failure at step 7-8:
   - Transient (network/HTTP) errors trigger Celery's automatic retry
     (exponential backoff, max 3 attempts)
   - Once retries are exhausted, worker sets status=failed + error_message

10. Client polls GET /api/v1/tryon/{job_id} until status is
    completed or failed
```

This guarantees: the API is never blocked by AI latency; failures are
recorded, not silently dropped; and jobs are resumable/retriable
independently of the request that created them.

## 7. AI Processing Pipeline

```
TryOnPipeline (abstract base, ai-service/app/pipelines/base_pipeline.py)
    │
    ├── run(TryOnInput) -> TryOnOutput
    │
    ▼
PlaceholderTryOnPipeline (Phase 1 implementation)
    1. Read user_image_key from object storage
    2. Read garment_image_key from object storage (unused by placeholder)
    3. Produce a result image (currently: user photo + banner overlay)
    4. Write result to object storage under tryon-results/
    5. Return { result_image_key, model_name: "placeholder-v0" }
```

The **model registry** (`ai-service/app/models/model_registry.py`) maps a
configured model name (`TRYON_MODEL_NAME` env var) to a concrete pipeline
class. To add a real model later:

1. Implement a new class satisfying `TryOnPipeline`.
2. Register it in `_REGISTRY`.
3. Set `TRYON_MODEL_NAME` to its key.

No backend code, API contract, or database schema changes are required —
this is the core "replaceable AI model" requirement satisfied structurally.

## 8. Storage Architecture

- **Abstraction:** `backend/app/storage/base.py` defines `ObjectStorage`
  with `generate_upload_url`, `generate_download_url`, `object_exists`,
  `delete_object`, `build_object_key`. `S3ObjectStorage` is the only
  implementation in Phase 1, using `boto3` against any S3-compatible
  endpoint (AWS S3, MinIO, R2, Spaces).
- **Upload flow:** clients never send image bytes through the backend.
  They call `POST /tryon/upload-url` to get a pre-signed PUT URL, upload
  directly to the bucket, then reference the resulting key when creating a
  job. This keeps the API stateless and avoids proxying large payloads.
- **Key namespacing:** `{namespace}/{owner_id}/{uuid}_{filename}`, e.g.
  `user-photos/<user_id>/9f2a3c_photo.jpg`, `tryon-results/<uuid>.png`.
- **Database references, not blobs:** every image column in Postgres
  (`user_image_key`, `garment_image_key`, `result_image_key`,
  `primary_image_key`, etc.) stores only the object key.
- **Shared bucket, dual access:** backend and AI service both connect to the
  same bucket using independent, minimal clients — the backend's full
  `ObjectStorage` abstraction (with pre-signed URLs for clients) and the AI
  service's lightweight `ObjectStorageClient` (direct read/write, no client
  exposure needed since it's only called server-to-server).

## Development Rules Applied

- **Clean Architecture / SOLID:** `api` → `services` → `repositories` →
  `models`, each layer depending only on abstractions below it. Storage and
  AI models are injected via interfaces, not hardcoded.
- **Dependency Injection:** FastAPI `Depends()` wires repositories, services,
  and the storage implementation (`app/core/dependencies.py`) — swapping the
  storage backend means changing one factory function.
- **Pydantic schemas** for every request/response; **SQLAlchemy models** for
  persistence; **Alembic** for migrations (no manual schema changes).
- **Structured logging** via a shared `logging_config.py` in each service.
- **Centralized error handling:** domain exceptions (`AppError` hierarchy)
  are translated to consistent JSON responses by a single FastAPI exception
  handler — no ad-hoc `HTTPException` scattered through business logic
  (except intentional Phase-1 `501` stubs).
- **No hardcoded AI logic in the backend:** the backend only knows the AI
  service's HTTP contract; it never imports or reasons about model internals.
