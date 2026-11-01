# Object Storage Structure

Reflects the current `ObjectStorage` abstraction (`app/storage/base.py`,
`app/storage/s3_storage.py`) and its key-building convention
(`build_object_key(namespace, owner_id, filename)` →
`{namespace}/{owner_id}/{uuid}_{filename}`).

## Namespace catalog

| Namespace | Contents | Written by | Referenced from |
|---|---|---|---|
| `user-photos/` | Shopper-uploaded photos used as the try-on subject | Client, via pre-signed URL from `POST /tryon/upload-url` | `tryon_jobs.user_image_key` |
| `body-reference/` *(planned distinct namespace — currently shares `user-photos/`)* | Body reference photo used for measurements/fit estimation | Client, via pre-signed URL | `body_profiles.reference_image_key` |
| `garments/` | Garment photos uploaded directly (not from the catalog) | Client, via pre-signed URL | `tryon_jobs.garment_image_key`, `wardrobe_items.image_key` (source=uploaded) |
| `catalog-products/` *(planned distinct namespace — currently unnamespaced, brand-uploaded)* | Product primary images | Brand admin upload flow (planned dedicated endpoint; today `primary_image_key` is settable via `POST /store/products` as a pre-existing key) | `products.primary_image_key` |
| `catalog-variants/` *(planned distinct namespace)* | Per-variant garment images (used as the default garment for try-on from the catalog) | Brand admin | `product_variants.garment_image_key` |
| `tryon-results/` | AI-generated try-on output images | AI service (`PlaceholderTryOnPipeline`, and any future real pipeline) | `tryon_jobs.result_image_key` |
| `wardrobe/` *(planned distinct namespace — currently shares `garments/` or `user-photos/` depending on source)* | Personal wardrobe item photos | Client, via pre-signed URL | `wardrobe_items.image_key` |
| `store-logos/` *(planned distinct namespace)* | Store branding/logo images | Brand admin | `stores.logo_image_key` |
| `exports/` *(planned)* | Generated reports/exports (e.g. a store's product catalog CSV export, audit log exports) | Backend, on-demand | Not referenced by any table — ephemeral, time-limited download links only |

**Current implementation note:** the codebase today uses only two literal
namespace strings in practice — `"user-photos"` (backend,
`app/api/v1/endpoints/tryon.py::create_upload_url`) and `"tryon-results"`
(AI service, `PlaceholderTryOnPipeline`). The richer namespace catalog
above is the **target convention** once garment/product/wardrobe uploads
get their own dedicated pre-signed-URL endpoints (today, `image_key` /
`garment_image_key` fields accept a client-supplied key from *any*
namespace, trusting the client to have used a real pre-signed URL — see
"Planned hardening" below). Application/system logs are **not** stored in
object storage — they go to stdout and a log aggregator (see
`DEVELOPMENT.md` structured logging), so there is no `system-logs/`
namespace.

## Key structure

```
{namespace}/{owner_id}/{random_hex_12}_{filename}
```

Example: `user-photos/3f2a1b90-.../9f2a3c1e4b7a_photo.jpg`

- `owner_id` is the acting user's id (string) — scopes keys per-user for
  easy auditing/cleanup, even though bucket-level access isn't restricted
  by prefix today (see "Planned hardening").
- The random hex segment prevents filename collisions and makes keys
  non-guessable (you can't enumerate another user's uploads by guessing
  sequential names).
- AI-generated results (`tryon-results/`) don't have an `owner_id` segment
  in the current `PlaceholderTryOnPipeline` implementation
  (`{namespace}/{uuid}.png`) — **planned fix:** include the owning user's
  id for consistency and easier lifecycle-policy targeting.

## Upload flow (all namespaces, same pattern)

1. Client requests a pre-signed URL: `POST /tryon/upload-url?filename=...&content_type=...`
   (today the only exposed pre-signed-*upload*-URL endpoint — read access
   below has its own endpoint; planned: equivalent upload endpoints for
   garment/product/wardrobe/logo namespaces, or a generalized
   `POST /storage/upload-url?namespace=...`).
2. Backend calls `build_object_key(...)`, then
   `generate_upload_url(key, content_type, expires_in=15min)`.
3. Client `PUT`s the file directly to the returned URL — the backend never
   receives the bytes.
4. Client references the resulting `object_key` in a subsequent API call
   (e.g. `POST /tryon`).

Download/read access is exposed via `POST /storage/download-urls`
(`{object_keys: [...]}`, up to 100 keys → `{download_urls: {key: url}}`;
the web app batches every image key requested within ~10ms into one call —
see `frontend/api/storage.ts::loadDownloadUrl`) and the single-key
`GET /tryon/download-url?object_key=...`
(`app/api/v1/endpoints/tryon.py::create_download_url`), which calls
`StorageService.get_download_url()` → `generate_download_url` (1 hour
expiry) unless `S3_PUBLIC_BASE_URL` is configured, in which case a public
CDN-style URL is returned instead (see
`app/storage/s3_storage.py::generate_download_url`). No per-key ownership
check — same trust model as every other endpoint that accepts a
client-supplied object key (see "Planned hardening" below). The frontend's
`shared/components/resolved-image.tsx` calls this for every wardrobe/
try-on/product image it renders, via `hooks/use-resolved-image-url.ts`.

## Planned hardening

- **Namespace-scoped upload permissions:** today, a client could
  theoretically request an upload URL for `namespace="tryon-results"` and
  write into a namespace meant only for AI-service output, since
  `build_object_key`'s `namespace` parameter isn't restricted per
  endpoint/caller. Planned: validate `namespace` against an allow-list per
  endpoint (e.g. `/tryon/upload-url` only ever allows `user-photos` and
  `garments`).
- **Per-user IAM scoping:** the current S3/MinIO credentials are shared
  platform-wide (one `S3_ACCESS_KEY`/`S3_SECRET_KEY` for the whole
  backend). Pre-signed URLs already limit *what* a client can do (only the
  specific key, only within the expiry window), but the backend's own
  credentials have full bucket access. Acceptable for the current
  single-tenant-bucket design; revisit if per-brand bucket isolation is
  ever needed.
- **Lifecycle policies:** no automatic expiry/archival of old
  `tryon-results/` images exists yet. Planned: a lifecycle rule (S3
  Intelligent-Tiering or a scheduled cleanup job) once storage costs
  warrant it, respecting `SECURITY.md`'s data retention policy.
- **Content-type/size validation:** pre-signed URLs constrain
  `Content-Type` but not file size or actual image validity. Planned:
  either enforce `Content-Length` via the pre-signed URL's policy
  conditions, or validate on first read (e.g. when the AI service loads
  the image) and fail the job cleanly if it's not a valid image.
