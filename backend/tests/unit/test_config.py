"""Unit tests for application configuration loading (app.core.config)."""

import pytest

from app.core.config import Settings, get_settings

pytestmark = pytest.mark.unit


def test_settings_load_from_environment(monkeypatch):
    monkeypatch.setenv("JWT_SECRET_KEY", "abc123")
    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg2://u:p@host:5432/db")
    monkeypatch.setenv("REDIS_URL", "redis://host:6379/0")
    monkeypatch.setenv("CELERY_BROKER_URL", "redis://host:6379/1")
    monkeypatch.setenv("CELERY_RESULT_BACKEND", "redis://host:6379/2")
    monkeypatch.setenv("AI_SERVICE_BASE_URL", "http://ai:8001/")
    monkeypatch.setenv("S3_ENDPOINT_URL", "http://minio:9000")
    monkeypatch.setenv("S3_ACCESS_KEY", "key")
    monkeypatch.setenv("S3_SECRET_KEY", "secret")
    monkeypatch.setenv("S3_BUCKET_NAME", "bucket")

    # Bypass the lru_cache so this test observes the freshly patched env.
    settings = Settings()

    assert settings.JWT_SECRET_KEY == "abc123"
    assert settings.DATABASE_URL.startswith("postgresql+psycopg2://")
    assert settings.S3_BUCKET_NAME == "bucket"


def test_settings_have_sane_defaults():
    settings = get_settings()

    assert settings.API_V1_PREFIX == "/api/v1"
    assert settings.JWT_ALGORITHM == "HS256"
    assert settings.ACCESS_TOKEN_EXPIRE_MINUTES > 0
    assert settings.REFRESH_TOKEN_EXPIRE_MINUTES > settings.ACCESS_TOKEN_EXPIRE_MINUTES


def test_get_settings_is_cached():
    assert get_settings() is get_settings()
