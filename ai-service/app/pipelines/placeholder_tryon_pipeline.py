"""
Placeholder virtual try-on pipeline.

Implements the TryOnPipeline contract WITHOUT any real generative model.
It composes a presentable preview — the user photo cropped to a 3:4
portrait, with the garment as an inset card and a small "Preview" label —
so the flow is end-to-end testable and the UI shows something sensible,
and writes the result back to object storage. This
lets the full system (job creation -> queueing -> AI call -> status update)
be built, deployed, and tested before a real model is integrated.

Swap this out in a later phase by adding a new class (e.g. DiffusionTryOnPipeline)
that implements the same TryOnPipeline interface, and pointing
TRYON_MODEL_NAME / the model registry at it. Nothing else changes.
"""

from io import BytesIO

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

from app.core.logging_config import get_logger
from app.pipelines.base_pipeline import TryOnInput, TryOnOutput, TryOnPipeline
from app.storage.s3_client import ObjectStorageClient

logger = get_logger(__name__)


def _open_rgb(data: bytes) -> Image.Image:
    """Decodes an upload, honoring its EXIF orientation (phone photos)."""
    image = Image.open(BytesIO(data))
    return (ImageOps.exif_transpose(image) or image).convert("RGB")


class PlaceholderTryOnPipeline(TryOnPipeline):
    name = "placeholder-v0"

    def __init__(self, storage: ObjectStorageClient | None = None):
        self.storage = storage or ObjectStorageClient()

    def run(self, payload: TryOnInput) -> TryOnOutput:
        logger.info("Running placeholder try-on pipeline for job=%s", payload.job_id)

        user_image_bytes = self.storage.read_object(payload.user_image_key)
        # A real pipeline renders the garment onto the person; the
        # placeholder shows it beside them as an inset card.
        garment_image_bytes = self.storage.read_object(payload.garment_image_key)

        result_image = self._generate_placeholder_result(user_image_bytes, garment_image_bytes)

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
    def _generate_placeholder_result(
        user_image_bytes: bytes, garment_image_bytes: bytes
    ) -> Image.Image:
        # Portrait 3:4 canvas from the user photo (center-weighted toward the
        # top, where faces usually are).
        person = _open_rgb(user_image_bytes)
        canvas = ImageOps.fit(person, (900, 1200), Image.Resampling.LANCZOS, centering=(0.5, 0.35))

        # Garment inset: a rounded white card with a soft shadow.
        garment = _open_rgb(garment_image_bytes)
        card_size = 280
        inner = ImageOps.fit(garment, (card_size - 24, card_size - 24), Image.Resampling.LANCZOS)
        card = Image.new("RGB", (card_size, card_size), (255, 255, 255))
        card.paste(inner, (12, 12))
        mask = Image.new("L", (card_size, card_size), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, card_size - 1, card_size - 1], 28, fill=255)

        x, y = canvas.width - card_size - 36, canvas.height - card_size - 36
        shadow = Image.new("L", canvas.size, 0)
        ImageDraw.Draw(shadow).rounded_rectangle(
            [x + 6, y + 10, x + card_size + 6, y + card_size + 10], 28, fill=110
        )
        shadow = shadow.filter(ImageFilter.GaussianBlur(14))
        canvas.paste((0, 0, 0), (0, 0), shadow)
        canvas.paste(card, (x, y), mask)

        # Small translucent label, so a placeholder result is never mistaken
        # for a real render.
        overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)
        font = ImageFont.load_default(size=26)
        label = "FitMirror preview"
        left, top, right, bottom = draw.textbbox((0, 0), label, font=font)
        width, height = right - left, bottom - top
        draw.rounded_rectangle(
            [28, 28, 28 + width + 40, 28 + height + 28], 24, fill=(20, 20, 20, 150)
        )
        draw.text((48 - left, 42 - top), label, font=font, fill=(255, 255, 255, 240))
        return Image.alpha_composite(canvas.convert("RGBA"), overlay).convert("RGB")
