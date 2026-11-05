"""
Integration tests for the AI service against a REAL S3-compatible bucket
(MinIO in dev/CI). Requires S3_ENDPOINT_URL etc. to point at a reachable,
already-created bucket.
"""

from io import BytesIO

import pytest
from PIL import Image

from app.storage.s3_client import ObjectStorageClient

pytestmark = pytest.mark.integration


def _fake_png_bytes(color: tuple[int, int, int] = (200, 50, 50)) -> bytes:
    # Above the input quality gate's 256px minimum (app/pipelines/quality.py).
    image = Image.new("RGB", (300, 400), color=color)
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def test_object_storage_round_trip():
    storage = ObjectStorageClient()
    data = _fake_png_bytes()

    key = storage.write_object(data, namespace="integration-test", content_type="image/png")
    read_back = storage.read_object(key)

    assert read_back == data


def test_generate_endpoint_end_to_end(client):
    storage = ObjectStorageClient()
    user_key = storage.write_object(_fake_png_bytes(), namespace="integration-test")
    garment_key = storage.write_object(
        _fake_png_bytes(color=(50, 50, 200)), namespace="integration-test"
    )

    response = client.post(
        "/api/v1/tryon/generate",
        json={
            "job_id": "integration-job-1",
            "user_image_key": user_key,
            "garment_image_key": garment_key,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["job_id"] == "integration-job-1"
    assert body["model_name"] == "placeholder-v0"
    assert body["result_image_key"]

    # The result should be a real, readable object in the bucket.
    result_bytes = storage.read_object(body["result_image_key"])
    assert Image.open(BytesIO(result_bytes)).format == "PNG"
