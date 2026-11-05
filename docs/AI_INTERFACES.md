# AI Model Interface Documentation

Documents the replaceable-model abstraction in `ai-service/app/pipelines/`
and `ai-service/app/models/model_registry.py`. This is the contract that
lets a real generative model replace `PlaceholderTryOnPipeline` with **no
changes** to the backend, API contracts, or database schema.

## `TryOnPipeline` interface

```python
# ai-service/app/pipelines/base_pipeline.py
class TryOnPipeline(ABC):
    name: str = "base"

    @abstractmethod
    def run(self, payload: TryOnInput) -> TryOnOutput:
        """Executes try-on generation, returns a reference to the result
        image already written to object storage. Must not return raw
        image bytes — only storage keys."""
```

Every concrete implementation (today: `PlaceholderTryOnPipeline`; future:
any real model) satisfies this single method. The AI service's API layer
(`app/api/v1/endpoints/tryon.py::generate_tryon`) depends only on this
interface via the model registry — it never imports a concrete pipeline
class directly.

## `TryOnInput`

```python
@dataclass
class TryOnInput:
    job_id: str
    user_image_key: str
    garment_image_key: str
```

- `job_id` — the backend's `tryon_jobs.id`, passed through as a string for
  logging/correlation; the pipeline doesn't need to look anything up with
  it, but it's included in every log line the pipeline emits.
- `user_image_key` / `garment_image_key` — object storage keys (see
  `STORAGE.md`), never raw bytes. The pipeline is responsible for reading
  them itself via the storage client.

## `TryOnOutput`

```python
@dataclass
class TryOnOutput:
    result_image_key: str
    model_name: str
```

- `result_image_key` — where the generated result was written (namespace
  `tryon-results/`, see `STORAGE.md`).
- `model_name` — identifies which pipeline/version produced this result;
  persisted onto `tryon_jobs.ai_model_name` by the Celery worker. This is
  what makes results auditable/explainable after the active model changes
  (see "Model versioning" below).

## Model registry, routing and quality gates (Phase 4)

Every request goes through `TryOnRouter` (`ai-service/app/pipelines/tryon_router.py`),
built by `model_registry.get_tryon_pipeline()` from configuration. Models
implement `TryOnModel.generate(person, garment, *, garment_category,
garment_description) -> Image`; storage, gates, routing and fallback are
the router's job.

| Model name | Class | Needs |
|---|---|---|
| `placeholder` | `PlaceholderTryOnPipeline` (`placeholder-v0`) | nothing — composes a labelled preview, for development |
| `idm-vton` | `ReplicateTryOnModel` (`idm-vton@<version[:8]>`) | `REPLICATE_API_TOKEN`, `REPLICATE_TRYON_VERSION` — IDM-VTON diffusion try-on on Replicate's GPUs |

| Setting | Meaning |
|---|---|
| `TRYON_MODEL_ROUTES` | Weighted A/B split, e.g. `idm-vton=90,placeholder=10`. The bucket is a hash of the job id, so a retried job hits the same model. Empty → all traffic to `TRYON_MODEL_NAME`. |
| `TRYON_FALLBACK_MODELS` | Tried in order if the routed model errors or its output is rejected (default: none, so the job fails with an honest error). Keep `placeholder` out of production: shoppers would get a fake result. |

Unknown model names fail loudly at first request (`ValueError`), never
silently. `GET /api/v1/health` reports the routing in effect.

**Quality and safety gates** (`ai-service/app/pipelines/quality.py`):

- *Input gate*, before any model call: both images must decode, be at
  least 256px on each side and no more than 3:1. Failures answer **422**
  with a shopper-facing reason; the backend worker fails the job at once
  (no retries) and stores the reason as `error_message`.
- *Output gate*, before storing: at least 256px, not blank/flat, and
  visibly different from the person photo. A rejected output falls back
  to the next model.
- *Content safety*: a pluggable `SafetyChecker` runs on every output; a
  rejection also falls back. The default allows everything — hosted
  models run their own safety checkers; plug a classifier in here for
  self-hosted ones.

The response's `model_name` (stored on `tryon_jobs.ai_model_name`)
identifies the exact model version, and `fallback_from` names the routed
model when a fallback produced the result (the worker logs it).

**Versioning and rollback:** model versions are pinned
(`REPLICATE_TRYON_VERSION`) and embedded in `model_name`. Roll out a new
version by routing a share of traffic to it, compare results per
`ai_model_name`, then shift the weights; rolling back is a config change.

**Timeouts:** the AI service gives Replicate `REPLICATE_TIMEOUT_SECONDS`
(150); the backend waits `AI_SERVICE_TIMEOUT_SECONDS` (180); Celery's
soft/hard task limits are 210/240, so a hung call ends as a retryable
HTTP timeout rather than a killed task.

## Future model replacement rules

To add a new model (e.g. a real diffusion-based virtual try-on model):

1. **Implement the interface.** Create a new class in
   `ai-service/app/pipelines/` implementing `TryOnModel.generate(...)`
   (image in, image out — see `replicate_tryon_model.py`). It may load
   weights, call an external inference API, use a GPU, etc. — the
   interface doesn't constrain the implementation, only the contract.
2. **Register it.** Add one line to `_REGISTRY` in `model_registry.py`.
3. **Configure it.** Route traffic to it with `TRYON_MODEL_ROUTES` (start
   with a small share) in the target environment's `.env`.
4. **Do not change:**
   - The backend (`app/services/tryon_service.py`,
     `app/workers/tasks/tryon_tasks.py`) — it only ever calls
     `POST /api/v1/tryon/generate` and reads `{result_image_key,
     model_name}` from the response. It has no knowledge of which
     pipeline is active.
   - The `TryOnGenerateRequest`/`TryOnGenerateResponse` schemas — the
     wire contract is stable across model swaps.
   - The database schema — `tryon_jobs` already has the columns needed
     (`ai_model_name`, `result_image_key`) for any future model.
5. **Do consider:**
   - Compute requirements (GPU scheduling, `docker-compose.prod.yml`
     resource limits/replicas for `ai-service`) — a real model will likely
     need very different resource sizing than the placeholder.
   - Timeout tuning — `AI_SERVICE_TIMEOUT_SECONDS` (backend config) and
     `task_time_limit`/`task_soft_time_limit` (Celery config, see
     `QUEUE_ARCHITECTURE.md`) are sized for the placeholder's near-instant
     response; a real model's inference latency will likely require
     raising these.
   - Content safety — plug a `SafetyChecker` into the router (see above)
     if the new model has no safety checker of its own.

## Stylist, Sizing and Shopping (backend services)

These run in the backend as services behind unchanged endpoint contracts
(they need the database — wardrobe, catalog, feedback — far more than a
GPU), using shared embeddings from `backend/app/ai/embeddings.py`:

| Embedder | When | Notes |
|---|---|---|
| `HashingEmbedder` (`hashing-v1`) | default | Local feature hashing of words + character trigrams (512-d). No network; captures shared vocabulary, not meaning. |
| `VoyageEmbedder` (`voyage:<model>`) | `VOYAGE_API_KEY` set | Voyage AI embeddings (`VOYAGE_EMBED_MODEL`, default `voyage-3.5-lite`). A failed call falls back to hashing for that whole request, so vectors in one comparison always share a space. |

Embeddings are computed per request (memoized in-process), never stored.

- **AI Stylist** (`stylist_service.py`): occasion rules + embedding
  similarity to the occasion + favorite colors + a learned taste model.
  Every suggestion is stored (`outfit_suggestions`, with each item's text);
  `POST /stylist/suggestions/{id}/feedback {liked}` labels it. The taste
  vector (liked minus disliked items), the per-item affinity and the
  liked/disliked item pairs steer later picks — including toward similar
  pieces never rated themselves.
- **Sizing** (`sizing_service.py`): brand size charts, then shopper fit
  feedback — see `API_CONTRACTS.md` "Size charts & fit feedback".
- **Shopping Assistant** (`shopping_service.py`): query understanding by
  Claude when `ANTHROPIC_API_KEY` is set (`app/ai/query_understanding.py`:
  structured outputs into a validated `ShoppingIntent` — category,
  audiences, price bounds, size, colors, keywords with synonyms, a
  rewrite for semantic search; `SHOPPING_LLM_MODEL`, default
  `claude-opus-5-5`, at low effort, with server-side refusal fallbacks,
  a 20s timeout and one retry). If the key is unset, or the call fails or
  is refused, the rule-based parser runs instead. Candidates are ranked by
  keyword hits plus `2 x` the embedding similarity between the query and
  each product.

| Setting | Default | Effect |
|---|---|---|
| `ANTHROPIC_API_KEY` | empty | Enables Claude query understanding |
| `SHOPPING_LLM_MODEL` | `claude-opus-5-5` | Model for query understanding |
| `SHOPPING_LLM_TIMEOUT_SECONDS` | `20` | Per-request timeout before falling back to rules |
| `VOYAGE_API_KEY` / `VOYAGE_EMBED_MODEL` | empty / `voyage-3.5-lite` | Hosted embeddings for stylist + shopping ranking |
