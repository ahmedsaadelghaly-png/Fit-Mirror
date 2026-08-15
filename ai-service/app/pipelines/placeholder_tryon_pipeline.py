"""
Placeholder virtual try-on pipeline.

Implements the TryOnPipeline contract WITHOUT any real generative model.
It reads the user photo, overlays a simple visual marker so the flow is
end-to-end testable, and writes the result back to object storage. This
lets the full system (job creation -> queueing -> AI call -> status update)
be built, deployed, and tested before a real model is integrated.

Swap this out in a later phase by adding a new class (e.g. DiffusionTryOnPipeline)
that implements the same TryOnPipeline interface, and pointing
TRYON_MODEL_NAME / the model registry at it. Nothing else changes.
"""

from io import BytesIO

from PIL import Image, ImageDraw

from app.core.logging_config import get_logger
from app.pipelines.base_pipeline import TryOnInput, TryOnOutput, TryOnPipeline
from app.storage.s3_client import ObjectStorageClient

logger = get_logger(__name__)


class PlaceholderTryOnPipeline(TryOnPipeline):
    name = "placeholder-v0"

    def __init__(self, storage: ObjectStorageClient | None = None):
        self.storage = storage or ObjectStorageClient()

    def run(self, payload: TryOnInput) -> TryOnOutput:
        logger.info("Running placeholder try-on pipeline for job=%s", payload.job_id)

        user_image_bytes = self.storage.read_object(payload.user_image_key)
        # The garment image is intentionally unused by this placeholder — a
        # real pipeline would composite it onto the user photo.
        _ = self.storage.read_object(payload.garment_image_key)

        result_image = self._generate_placeholder_result(user_image_bytes)

        buffer = BytesIO()
        result_image.save(buffer, format="PNG")

        result_image_key = self.storage.write_object(
            buffer.getvalue(), namespace="tryon-results", content_type="image/png"
        )

        logger.info(
            "Placeholder try-on complete for job=%s -> %s", payload.job_id, result_image_key
        )
        return TryOnOutput(result_image_key=result_image_key, model_name=self.name)

    @staticmethod
    def _generate_placeholder_result(user_image_bytes: bytes) -> Image.Image:
        image = Image.open(BytesIO(user_image_bytes)).convert("RGB")
        draw = ImageDraw.Draw(image)
        banner_height = max(40, image.height // 12)
        draw.rectangle([0, 0, image.width, banner_height], fill=(20, 20, 20))
        draw.text(
            (12, banner_height // 4),
            "FitMirror AI — placeholder try-on result",
            fill=(255, 255, 255),
        )
        return image
