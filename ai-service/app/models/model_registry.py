"""
Model registry: maps configured model names to concrete model classes and
builds the TryOnRouter that serves every try-on request. This is the single
place that changes when a new AI model is added — API endpoints and the
backend never import a concrete model.

Configuration:
- TRYON_MODEL_ROUTES — weighted A/B split, e.g. "idm-vton=90,placeholder=10".
  Empty: all traffic goes to TRYON_MODEL_NAME.
- TRYON_FALLBACK_MODELS — tried in order when the routed model fails or its
  output is rejected (default "placeholder", which needs no GPU or key).
"""

from functools import lru_cache

from app.core.config import settings
from app.pipelines.base_pipeline import TryOnModel, TryOnPipeline
from app.pipelines.placeholder_tryon_pipeline import PlaceholderTryOnPipeline
from app.pipelines.replicate_tryon_model import ReplicateTryOnModel
from app.pipelines.tryon_router import TryOnRouter, parse_routes

_REGISTRY: dict[str, type[TryOnModel]] = {
    "placeholder": PlaceholderTryOnPipeline,
    "idm-vton": ReplicateTryOnModel,
}


def get_tryon_pipeline() -> TryOnPipeline:
    return _build_router(
        settings.TRYON_MODEL_ROUTES or settings.TRYON_MODEL_NAME,
        settings.TRYON_FALLBACK_MODELS,
    )


def active_models() -> dict[str, object]:
    """For the health endpoint: the routing as configured."""
    routes = parse_routes(settings.TRYON_MODEL_ROUTES or settings.TRYON_MODEL_NAME)
    return {
        "routes": dict(routes),
        "fallbacks": [n.strip() for n in settings.TRYON_FALLBACK_MODELS.split(",") if n.strip()],
    }


@lru_cache
def _build_router(route_spec: str, fallback_spec: str) -> TryOnRouter:
    """Built once per process (per configuration): models hold expensive
    state (HTTP clients, storage clients, loaded weights) that must not be
    rebuilt on every request."""
    routes = parse_routes(route_spec)
    fallbacks = [name.strip() for name in fallback_spec.split(",") if name.strip()]
    names = dict.fromkeys([name for name, _ in routes] + fallbacks)
    unknown = [name for name in names if name not in _REGISTRY]
    if unknown:
        raise ValueError(
            f"Unknown try-on model(s) {unknown} in TRYON_MODEL_NAME/TRYON_MODEL_ROUTES/"
            f"TRYON_FALLBACK_MODELS. Available: {list(_REGISTRY)}"
        )
    models = {name: _REGISTRY[name]() for name in names}
    return TryOnRouter(models, routes, fallbacks)
