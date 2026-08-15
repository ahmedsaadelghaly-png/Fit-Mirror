"""Shared pytest fixtures for the AI service test suite."""

import os

os.environ.setdefault("S3_ENDPOINT_URL", "http://localhost:9000")
os.environ.setdefault("S3_ACCESS_KEY", "fitmirror")
os.environ.setdefault("S3_SECRET_KEY", "fitmirror123")
os.environ.setdefault("S3_BUCKET_NAME", "fitmirror-media-test")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)
