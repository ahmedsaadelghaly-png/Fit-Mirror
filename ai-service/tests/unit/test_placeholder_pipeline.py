"""
Unit tests for the placeholder try-on pipeline and the model registry.

Storage is mocked, so these tests never touch a real S3/MinIO bucket —
they verify the pipeline's own logic (reads input, writes output, returns
the correct contract) in isolation.
"""

from io import BytesIO
from unittest.mock import MagicMock

import pytest
from PIL import Image

from app.models.model_registry import get_tryon_pipeline
from app.pipelines.base_pipeline import TryOnInput, TryOnOutput
from app.pipelines.placeholder_tryon_pipeline import PlaceholderTryOnPipeline

pytestmark = pytest.mark.unit


def _fake_png_bytes(size=(100, 100), color=(10, 20, 30)) -> bytes:
    image = Image.new("RGB", size, color=color)
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def test_placeholder_pipeline_returns_result_contract():
    mock_storage = MagicMock()
    mock_storage.read_object.return_value = _fake_png_bytes()
    mock_storage.write_object.return_value = "tryon-results/abc123.png"

    pipeline = PlaceholderTryOnPipeline(storage=mock_storage)
    result = pipeline.run(
        TryOnInput(job_id="job-1", user_image_key="user.png", garment_image_key="garment.png")
    )

    assert isinstance(result, TryOnOutput)
    assert result.result_image_key == "tryon-results/abc123.png"
    assert result.model_name == "placeholder-v0"
    mock_storage.read_object.assert_any_call("user.png")
    mock_storage.read_object.assert_any_call("garment.png")


def test_placeholder_pipeline_writes_valid_png():
    mock_storage = MagicMock()
    mock_storage.read_object.return_value = _fake_png_bytes()
    written = {}

    def fake_write_object(data: bytes, *, namespace: str, content_type: str):
        written["data"] = data
        written["namespace"] = namespace
        written["content_type"] = content_type
        return "tryon-results/xyz.png"

    mock_storage.write_object.side_effect = fake_write_object

    pipeline = PlaceholderTryOnPipeline(storage=mock_storage)
    pipeline.run(TryOnInput(job_id="job-2", user_image_key="u.png", garment_image_key="g.png"))

    assert written["namespace"] == "tryon-results"
    assert written["content_type"] == "image/png"
    # Confirm the written bytes are a real, decodable PNG.
    result_image = Image.open(BytesIO(written["data"]))
    assert result_image.format == "PNG"


def test_model_registry_resolves_configured_pipeline():
    pipeline = get_tryon_pipeline()
    assert pipeline.name == "placeholder-v0"
    assert isinstance(pipeline, PlaceholderTryOnPipeline)


def test_model_registry_raises_for_unknown_model(monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "TRYON_MODEL_NAME", "nonexistent-model")

    with pytest.raises(ValueError, match="Unknown TRYON_MODEL_NAME"):
        get_tryon_pipeline()
