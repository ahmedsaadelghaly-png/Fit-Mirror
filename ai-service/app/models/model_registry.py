"""
Model registry: maps a configured model name to a concrete pipeline
implementation. This is the single place that needs to change when a new
AI model is added — API endpoints and workers never import a concrete
pipeline class directly.
"""

from app.core.config import settings
from app.pipelines.base_pipeline import TryOnPipeline
from app.pipelines.placeholder_tryon_pipeline import PlaceholderTryOnPipeline

_REGISTRY: dict[str, type[TryOnPipeline]] = {
    "placeholder": PlaceholderTryOnPipeline,
    # "diffusion_v1": DiffusionTryOnPipeline,   # add future real models here
}


def get_tryon_pipeline() -> TryOnPipeline:
    pipeline_cls = _REGISTRY.get(settings.TRYON_MODEL_NAME)
    if pipeline_cls is None:
        raise ValueError(
            f"Unknown TRYON_MODEL_NAME='{settings.TRYON_MODEL_NAME}'. "
            f"Available: {list(_REGISTRY.keys())}"
        )
    return pipeline_cls()
