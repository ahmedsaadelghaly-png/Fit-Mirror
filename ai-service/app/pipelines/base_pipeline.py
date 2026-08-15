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


@dataclass
class TryOnInput:
    job_id: str
    user_image_key: str
    garment_image_key: str


@dataclass
class TryOnOutput:
    result_image_key: str
    model_name: str


class TryOnPipeline(ABC):
    """Contract every virtual try-on model implementation must satisfy."""

    name: str = "base"

    @abstractmethod
    def run(self, payload: TryOnInput) -> TryOnOutput:
        """Executes the try-on generation and returns a reference to the
        result image already written to object storage. Implementations
        must not return raw image bytes — only storage keys."""
        raise NotImplementedError
