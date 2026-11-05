"""Shared pytest fixtures for the AI service test suite."""

import os

os.environ.setdefault("S3_ENDPOINT_URL", "http://localhost:9000")
os.environ.setdefault("S3_ACCESS_KEY", "fitmirror")
os.environ.setdefault("S3_SECRET_KEY", "fitmirror123")
os.environ.setdefault("S3_BUCKET_NAME", "fitmirror-media-test")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


def pytest_collection_modifyitems(items: list[pytest.Item]) -> None:
    """Everything under tests/unit is a unit test. CI selects with `-m unit`,
    so a file that forgets the marker would otherwise silently never run."""
    for item in items:
        if "unit" in item.path.parts:
            item.add_marker(pytest.mark.unit)


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)
