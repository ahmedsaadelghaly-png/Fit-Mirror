# Sequence Diagrams

All diagrams reflect the **current, implemented** flow unless a step is
explicitly marked `(planned)`. See `ROADMAP.md` for phase context on
planned steps.

## 1. User registration

```mermaid
sequenceDiagram
    participant C as Client
    participant B as Backend API
    participant DB as PostgreSQL

    C->>B: POST /api/v1/auth/register {email, password, full_name}
    B->>DB: SELECT users WHERE email = ?
    alt email already exists
        DB-->>B: row found
        B-->>C: 409 CONFLICT {error_code: "conflict"}
    else email is free
        DB-->>B: no row
        B->>B: hash_password(password) [bcrypt]
        B->>DB: INSERT INTO users (...)
        DB-->>B: new user row
        B-->>C: 201 Created {id, email, full_name, role, is_active}
    end
```

## 2. Login

```mermaid
sequenceDiagram
    participant C as Client
    participant B as Backend API
    participant DB as PostgreSQL

    C->>B: POST /api/v1/auth/login {email, password}
    B->>DB: SELECT users WHERE email = ?
    alt user not found or inactive or password mismatch
        B-->>C: 401 Unauthorized {error_code: "unauthorized"}
    else credentials valid
        B->>B: create_token(access, 60min) + create_token(refresh, 7d)
        B-->>C: 200 OK {access_token, refresh_token, token_type: "bearer"}
    end
    Note over B: (planned) emit audit_logs event "user.login"
```

## 3. Profile setup (body profile)

```mermaid
sequenceDiagram
    participant C as Client
    participant B as Backend API
    participant DB as PostgreSQL

    C->>B: PUT /api/v1/users/me/body-profile {height_cm, weight_kg, ...}
    Note right of C: Authorization: Bearer <access_token>
    B->>B: decode_token -> user_id
    B->>DB: SELECT body_profiles WHERE user_id = ?
    alt no existing profile
        B->>DB: INSERT INTO body_profiles (user_id, ...)
    else profile exists
        B->>DB: UPDATE body_profiles SET ... WHERE user_id = ?
    end
    DB-->>B: profile row
    B-->>C: 200 OK {id, height_cm, weight_kg, ..., reference_image_key}
```

## 4. Upload image using a pre-signed URL

```mermaid
sequenceDiagram
    participant C as Client
    participant B as Backend API
    participant S3 as Object Storage (S3/MinIO)

    C->>B: POST /api/v1/tryon/upload-url?filename=photo.jpg&content_type=image/jpeg
    B->>B: build_object_key(namespace="user-photos", owner_id, filename)
    B->>S3: generate_presigned_url("put_object", key, expires=15min)
    S3-->>B: pre-signed URL
    B-->>C: 200 OK {object_key, upload_url, expires_in_seconds: 900}

    C->>S3: PUT upload_url  (raw image bytes, Content-Type header)
    S3-->>C: 200 OK

    Note over C,B: Client now has object_key to reference in a later request<br/>(e.g. POST /tryon). The backend never touches the image bytes.
```

## 5. Create try-on job

```mermaid
sequenceDiagram
    participant C as Client
    participant B as Backend API
    participant DB as PostgreSQL
    participant Q as Redis (Celery broker)

    C->>B: POST /api/v1/tryon {user_image_key, garment_image_key | product_variant_id}
    alt product_variant_id given, no garment_image_key
        B->>DB: SELECT product_variants WHERE id = ?
        alt not found
            B-->>C: 404 Not Found {error_code: "not_found"}
        else found
            DB-->>B: variant.garment_image_key
        end
    end
    alt neither garment_image_key nor product_variant_id resolved
        B-->>C: 422 {error_code: "validation_error"}
    else garment image resolved
        B->>DB: INSERT INTO tryon_jobs (status=pending, ...)
        DB-->>B: job row (id)
        B->>Q: process_tryon_job.delay(job_id)
        B-->>C: 202 Accepted {job_id, status: "pending"}
    end
```

## 6. Celery worker processing

```mermaid
sequenceDiagram
    participant Q as Redis (Celery broker)
    participant W as Celery Worker
    participant DB as PostgreSQL
    participant AI as AI Service

    Q->>W: deliver task process_tryon_job(job_id)
    W->>DB: SELECT tryon_jobs WHERE id = ?
    alt job not found
        W->>W: log error, abort task
    else job found
        W->>DB: UPDATE tryon_jobs SET status = 'processing'
        W->>AI: POST /api/v1/tryon/generate {job_id, user_image_key, garment_image_key}
        alt AI service call succeeds
            AI-->>W: 200 {result_image_key, model_name}
            W->>DB: UPDATE tryon_jobs SET status='completed', result_image_key, ai_model_name
        else transient HTTP error (autoretry_for=httpx.HTTPError)
            AI-->>W: connection error / 5xx
            W->>Q: Celery reschedules task (exponential backoff, max_retries=3)
            Note over W,Q: on final exhausted retry:
            W->>DB: UPDATE tryon_jobs SET status='failed', error_message
        end
    end
```

## 7. AI service generation (inside the AI service)

```mermaid
sequenceDiagram
    participant W as Celery Worker (caller)
    participant AI as AI Service (FastAPI)
    participant Reg as Model Registry
    participant P as TryOnPipeline impl
    participant S3 as Object Storage

    W->>AI: POST /api/v1/tryon/generate {job_id, user_image_key, garment_image_key}
    AI->>Reg: get_tryon_pipeline()
    Reg-->>AI: pipeline instance (resolved from TRYON_MODEL_NAME)
    AI->>P: run(TryOnInput(job_id, user_image_key, garment_image_key))
    P->>S3: read_object(user_image_key)
    S3-->>P: image bytes
    P->>S3: read_object(garment_image_key)
    S3-->>P: image bytes
    P->>P: generate result (placeholder: overlay banner;<br/>real model (planned): actual garment compositing)
    P->>S3: write_object(result_bytes, namespace="tryon-results")
    S3-->>P: result_image_key
    P-->>AI: TryOnOutput(result_image_key, model_name)
    AI-->>W: 200 {job_id, result_image_key, model_name}
```

## 8. Store product creation

```mermaid
sequenceDiagram
    participant C as Client (brand_admin)
    participant B as Backend API
    participant DB as PostgreSQL

    C->>B: POST /api/v1/store/products {title, category, price, currency}
    B->>B: decode_token -> user_id
    B->>DB: SELECT stores WHERE owner_user_id = ?
    alt no store registered
        B-->>C: 404 Not Found {error_code: "not_found"}
    else store found
        B->>DB: INSERT INTO products (store_id, title, ...)
        DB-->>B: product row
        B-->>C: 201 Created {id, title, ..., variants: []}
        Note over B: (planned) emit audit_logs event "product.created"
    end
```

## 9. Wardrobe item creation

```mermaid
sequenceDiagram
    participant C as Client
    participant B as Backend API
    participant DB as PostgreSQL

    C->>B: POST /api/v1/wardrobe {source, category, label, image_key[, product_variant_id]}
    B->>B: decode_token -> user_id
    B->>DB: INSERT INTO wardrobe_items (user_id, source, ...)
    DB-->>B: wardrobe_item row
    B-->>C: 201 Created {id, source, category, label, image_key}
```

## 10. Outfit recommendation request (planned — Phase 3)

```mermaid
sequenceDiagram
    participant C as Client
    participant B as Backend API
    participant DB as PostgreSQL
    participant AI as AI Service (Stylist pipeline, planned)

    C->>B: POST /api/v1/stylist/suggestions {occasion, weather}
    Note over B: Phase 1/1.5/1.75: returns 501 Not Implemented today
    B-->>C: 501 {"detail": "AI Stylist is scheduled for a later phase."}

    rect rgb(245, 245, 245)
        Note over C,AI: Planned end-state flow (Phase 3):
        B->>DB: SELECT wardrobe_items WHERE user_id = ?
        B->>DB: SELECT body_profiles WHERE user_id = ?
        B->>AI: POST /stylist/generate {wardrobe_item_ids, occasion, weather, body_profile}
        AI-->>B: {suggested_item_ids, rationale, confidence}
        B->>DB: INSERT INTO recommendations (user_id, recommendation_type='outfit', payload, confidence)
        B-->>C: 200 {suggestion_id, wardrobe_item_ids, rationale}
    end
```
