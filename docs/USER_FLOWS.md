# User Flows

High-level user journeys, distinct from `SEQUENCE_DIAGRAMS.md` (which shows
system-internal request/response detail). These flows show what the
*person* experiences, screen-to-screen — useful input for Phase 2 frontend
design even though no frontend exists yet.

## 1. Shopper onboarding

```mermaid
flowchart TD
    A[Land on app] --> B[Register: email, password, name]
    B --> C[Login]
    C --> D{Body profile set?}
    D -- No --> E[Prompt: set up body profile]
    E --> F[Enter height/weight/measurements<br/>and/or upload reference photo]
    F --> G[Body profile saved]
    D -- Yes --> H[Shopper home]
    G --> H
    H --> I[Browse catalog / try something on / build wardrobe]
```

- Body profile is optional at registration time — a shopper can skip it and
  browse, but Size Recommendation (planned) and best-fit Try-On results
  depend on it, so the UI should nudge without blocking.
- Endpoints involved: `POST /auth/register`, `POST /auth/login`,
  `GET /users/me/body-profile`, `PUT /users/me/body-profile`.

## 2. Brand onboarding

```mermaid
flowchart TD
    A[Register with brand intent] --> B[Login]
    B --> C{Store registered?}
    C -- No --> D[Create store: name, slug]
    D --> E[Store created, is_verified=false]
    E --> F{planned: Platform admin review}
    F -- Approved --> G[is_verified=true]
    F -- Pending --> H[Store dashboard shows 'pending verification']
    C -- Yes --> I[Store dashboard]
    G --> I
    I --> J[Add products + variants]
    J --> K[View dashboard summary:<br/>product count, try-on job stats]
```

- Today, `role` is set at the account level (`brand_admin`), not derived
  from store ownership — a `brand_admin` user simply hasn't created a
  store yet until step D. There's no separate "apply to become a brand"
  approval gate in Phase 1/1.5/1.75; `is_verified` exists on `stores` but
  the review workflow that flips it is **planned** (see `NOTIFICATIONS.md`
  → "store approved").
- Endpoints involved: `POST /store`, `GET /store/me`, `GET /store/me/summary`,
  `POST /store/products`, `GET /store/products`.

## 3. Upload body photo

```mermaid
flowchart TD
    A[Choose 'Upload photo'] --> B[Request pre-signed upload URL]
    B --> C[Client PUTs file directly to object storage]
    C --> D{Upload succeeded?}
    D -- No --> E[Show retry — STORAGE_UPLOAD_FAILED]
    D -- Yes --> F[Client has object_key]
    F --> G{Purpose?}
    G -- Body reference --> H[Attach key to body_profiles.reference_image_key]
    G -- Try-on subject --> I[Use key as tryon_jobs.user_image_key]
```

- The backend never sees the raw image bytes — see `STORAGE.md` for the
  pre-signed URL contract. This is the same flow for garment photos and
  wardrobe uploads; only the target `namespace` and where the resulting
  key is attached differ.

## 4. Try-on flow

```mermaid
flowchart TD
    A[Pick a product variant OR upload a garment photo] --> B[Ensure a user photo is uploaded]
    B --> C[POST /tryon -> job created, status=pending]
    C --> D[Poll GET /tryon/job_id]
    D --> E{status?}
    E -- pending/processing --> D
    E -- completed --> F[Show result_image_key as the try-on result]
    E -- failed --> G[Show error_message + retry option]
    F --> H[Optional: save as a Look — planned]
```

- Recommended poll interval: 2s with backoff (see `API_CONTRACTS.md`).
- Step H (Saved Looks) is **planned** — see `saved_looks` in `ERD.md`.

## 5. Wardrobe flow

```mermaid
flowchart TD
    A[Open Wardrobe] --> B[GET /wardrobe -> list items]
    B --> C{Add new item}
    C -- From own photo --> D[Upload via pre-signed URL] --> E[POST /wardrobe source=uploaded]
    C -- From catalog --> F[Pick a product_variant] --> G[POST /wardrobe source=catalog, product_variant_id]
    E --> H[Item appears in wardrobe grid]
    G --> H
    H --> I{Remove item?}
    I -- Yes --> J[DELETE /wardrobe/item_id]
    I -- No --> K[Use item in a try-on or outfit recommendation]
```

## 6. Store dashboard flow

```mermaid
flowchart TD
    A[Brand admin logs in] --> B[GET /store/me]
    B --> C{Store exists?}
    C -- No --> D[Prompt to create store]
    C -- Yes --> E[GET /store/me/summary]
    E --> F[View: product count, total/completed/failed try-on jobs]
    F --> G[GET /store/products -> manage catalog]
    G --> H[POST /store/products -> add new product]
    H --> I[planned: add variants, upload images, bulk import]
```

## 7. Saved looks flow (planned — see `saved_looks` in `ERD.md`)

```mermaid
flowchart TD
    A[Completed try-on result] --> B[Tap 'Save as Look']
    B --> C[POST /looks planned: {tryon_job_id, title}]
    C --> D[Look appears in 'My Looks' gallery]
    D --> E{Revisit later}
    E --> F[GET /looks/look_id planned]
    F --> G[Re-run try-on with same items, or share — planned]
```

## 8. Shopping assistant flow (planned — Phase 5)

```mermaid
flowchart TD
    A[Open Shopping Assistant chat] --> B[Type natural-language query]
    B --> C[POST /shopping/ask]
    C --> D{Implemented?}
    D -- Today --> E[501 Not Implemented]
    D -- Planned end-state --> F[AI matches query to catalog products]
    F --> G[Show matched products + conversational reply]
    G --> H[Add to wardrobe / start a try-on / add to cart planned]
```

- Today (`Phase 1.75`), this flow terminates at step E — the contract
  exists (`POST /shopping/ask` returns request/response shapes in
  `API_CONTRACTS.md`) but always responds `501`. The rest of the diagram
  documents the intended end-state so frontend work can anticipate the
  eventual UI shape.
