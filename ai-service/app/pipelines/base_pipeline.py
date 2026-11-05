"""
Try-on pipeline abstraction.

Every concrete AI model implementation (placeholder, a future diffusion-based
virtual try-on model, a third-party API wrapper, etc.) implements this
interface. Callers (the API layer) depend only on TryOnPipeline, never on a
specific model — this is what makes AI models replaceable without touching
API contracts or backend integration.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass

from PIL import Image

# Garment categories models understand (IDM-VTON's three, for instance).
GARMENT_CATEGORIES = ("upper_body", "lower_body", "dresses")


@dataclass
class TryOnInput:
    job_id: str
    user_image_key: str
    garment_image_key: str
    # Optional hints for models that use them (catalog try-ons send these).
    garment_category: str | None = None
    garment_description: str | None = None


@dataclass
class TryOnOutput:
    result_image_key: str
    model_name: str
    # Set when the routed model failed and a fallback produced the result.
    fallback_from: str | None = None


class TryOnModel(ABC):
    """One generative model: person photo + garment image -> result image.
    Storage, quality gates, routing and fallback live in TryOnRouter, so a
    model only has to turn images into an image."""

    name: str = "base"

    @abstractmethod
    def generate(
        self,
        person: Image.Image,
        garment: Image.Image,
        *,
        garment_category: str | None = None,
        garment_description: str | None = None,
    ) -> Image.Image:
        raise NotImplementedError


class TryOnPipeline(ABC):
    """Contract every virtual try-on model implementation must satisfy."""

    name: str = "base"

    @abstractmethod
    def run(self, payload: TryOnInput) -> TryOnOutput:
        """Executes the try-on generation and returns a reference to the
        result image already written to object storage. Implementations
        must not return raw image bytes — only storage keys."""
        raise NotImplementedError
