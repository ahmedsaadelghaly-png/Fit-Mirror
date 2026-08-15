"""Unit tests for the AI service health endpoint and configuration loading."""

import pytest

from app.core.config import Settings, get_settings

pytestmark = pytest.mark.unit


def test_root_health_check(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_v1_health_check_reports_active_model(client):
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "active_model" in body


def test_settings_default_model_is_placeholder():
    settings = get_settings()
    assert settings.TRYON_MODEL_NAME == "placeholder"


def test_settings_load_from_environment(monkeypatch):
    monkeypatch.setenv("S3_ENDPOINT_URL", "http://minio:9000")
    monkeypatch.setenv("S3_ACCESS_KEY", "key")
    monkeypatch.setenv("S3_SECRET_KEY", "secret")
    monkeypatch.setenv("S3_BUCKET_NAME", "bucket")
    monkeypatch.setenv("TRYON_MODEL_NAME", "diffusion_v1")

    settings = Settings()

    assert settings.TRYON_MODEL_NAME == "diffusion_v1"
    assert settings.S3_BUCKET_NAME == "bucket"
