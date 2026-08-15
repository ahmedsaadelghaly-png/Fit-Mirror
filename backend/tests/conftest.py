"""
Shared pytest fixtures for the backend test suite.

Sets sane default environment variables BEFORE `app.*` is imported anywhere,
so plain `unit` tests (health check, config loading, mocked services) can
import the app without a live Postgres/Redis/MinIO connection. `integration`
tests rely on these same variables being pointed at real services (see
docker-compose / CI env) and will fail loudly if those services are absent —
that's expected, since they're not meant to run in a bare environment.
"""

import os

os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("DEBUG", "true")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault(
    "DATABASE_URL", "postgresql+psycopg2://fitmirror:fitmirror@localhost:5432/fitmirror_test"
)
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("CELERY_BROKER_URL", "redis://localhost:6379/1")
os.environ.setdefault("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")
os.environ.setdefault("AI_SERVICE_BASE_URL", "http://localhost:8001/")
os.environ.setdefault("S3_ENDPOINT_URL", "http://localhost:9000")
os.environ.setdefault("S3_ACCESS_KEY", "fitmirror")
os.environ.setdefault("S3_SECRET_KEY", "fitmirror123")
os.environ.setdefault("S3_BUCKET_NAME", "fitmirror-media-test")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import Session, sessionmaker  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.db.base_all_models import Base  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture
def client() -> TestClient:
    """A TestClient for endpoint-level tests that don't touch the database
    (e.g. health checks, validation errors on malformed input)."""
    return TestClient(app)


@pytest.fixture(scope="session")
def db_engine():
    """Real Postgres engine for integration tests. Requires DATABASE_URL to
    point at a reachable database (see docker-compose / CI service containers)."""
    engine = create_engine(settings.DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture
def db_session(db_engine) -> Session:
    """A transactional session for integration tests — rolls back after each test."""
    connection = db_engine.connect()
    transaction = connection.begin()
    SessionLocal = sessionmaker(bind=connection)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()
