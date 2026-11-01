"""
Model registry: maps a configured model name to a concrete pipeline
implementation. This is the single place that needs to change when a new
AI model is added — API endpoints and workers never import a concrete
pipeline class directly.
"""

from functools import lru_cache

from app.core.config import settings
from app.pipelines.base_pipeline import TryOnPipeline
from app.pipelines.placeholder_tryon_pipeline import PlaceholderTryOnPipeline

_REGISTRY: dict[str, type[TryOnPipeline]] = {
    "placeholder": PlaceholderTryOnPipeline,
    # "diffusion_v1": DiffusionTryOnPipeline,   # add future real models here
}


def get_tryon_pipeline() -> TryOnPipeline:
    return _build_pipeline(settings.TRYON_MODEL_NAME)


@lru_cache
def _build_pipeline(model_name: str) -> TryOnPipeline:
    """Built once per process (per model name): pipelines hold expensive
    state (a storage client today, loaded model weights once a real model
    lands) that must not be rebuilt on every request."""
    pipeline_cls = _REGISTRY.get(model_name)
    if pipeline_cls is None:
        raise ValueError(
            f"Unknown TRYON_MODEL_NAME='{model_name}'. " f"Available: {list(_REGISTRY.keys())}"
        )
    return pipeline_cls()
