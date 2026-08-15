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

## Model registry

```python
# ai-service/app/models/model_registry.py
_REGISTRY: dict[str, type[TryOnPipeline]] = {
    "placeholder": PlaceholderTryOnPipeline,
    # "diffusion_v1": DiffusionTryOnPipeline,   # planned
}

def get_tryon_pipeline() -> TryOnPipeline:
    pipeline_cls = _REGISTRY.get(settings.TRYON_MODEL_NAME)
    if pipeline_cls is None:
        raise ValueError(f"Unknown TRYON_MODEL_NAME='{settings.TRYON_MODEL_NAME}'. ...")
    return pipeline_cls()
```

- The active pipeline is selected purely by the `TRYON_MODEL_NAME`
  environment variable — a deploy-time config change, not a code change.
- The registry raises loudly (`ValueError`) on an unknown model name
  rather than silently falling back — a misconfigured deployment should
  fail fast at first request, not degrade silently to the wrong model.

## Model versioning (design, mostly planned)

| Aspect | Current state | Planned |
|---|---|---|
| Version identity | `PlaceholderTryOnPipeline.name = "placeholder-v0"` — version is baked into the class's `name` string | Same convention, extended: real models should version their `name` (e.g. `"diffusion-v1"`, `"diffusion-v1.1"`) so `tryon_jobs.ai_model_name` distinguishes minor model updates, not just major swaps |
| Multiple concurrent versions | Not supported — one `TRYON_MODEL_NAME` per AI service deployment | **Planned:** register multiple versions in `_REGISTRY` simultaneously and select per-request (e.g. via a request field or a feature flag — see `FEATURE_FLAGS.md`) for A/B testing or gradual rollout |
| Rollback | Redeploy with `TRYON_MODEL_NAME` set to the previous value | Same — since selection is env-var-driven, rollback is a config change, not a code revert |
| Historical auditability | `tryon_jobs.ai_model_name` records which model produced each result, forever (not just "current model") | Sufficient as-is; no planned change |

## Future model replacement rules

To add a new model (e.g. a real diffusion-based virtual try-on model):

1. **Implement the interface.** Create a new class in
   `ai-service/app/pipelines/`, e.g. `DiffusionTryOnPipeline(TryOnPipeline)`,
   implementing `run(payload: TryOnInput) -> TryOnOutput`. It may load
   weights, call an external inference API, use a GPU, etc. — the
   interface doesn't constrain the implementation, only the contract.
2. **Register it.** Add one line to `_REGISTRY` in `model_registry.py`.
3. **Configure it.** Set `TRYON_MODEL_NAME` in the target environment's
   `.env` (see `.env.production.example`).
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
   - Content safety — a real generative model needs output moderation
     that the placeholder has no need for (it only overlays a static
     banner). This is explicitly **out of scope** until a real model
     lands; tracked in `ROADMAP.md` Phase 6.

## Planned: Stylist / Sizing / Shopping pipelines

The same interface pattern (abstract base + registry) is the intended
shape for the other AI-dependent features once they move past their
current `501` stub state:

- `StylistPipeline` (Phase 3) — input: wardrobe items + body profile +
  occasion/weather; output: suggested item combination + rationale.
- `SizingPipeline` (Phase 4) — input: body profile + a product's size
  chart; output: recommended size + confidence.
- `ShoppingPipeline` (Phase 5) — input: natural-language query + catalog;
  output: matched products + conversational reply.

None of these exist yet. When they're implemented, they should live
alongside `TryOnPipeline` in `ai-service/app/pipelines/`, each with its own
registry, so that adding a new AI capability never requires touching the
backend beyond calling a new, equally simple HTTP endpoint.
