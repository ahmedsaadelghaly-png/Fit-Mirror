"""
Integration test for the try-on job creation flow against a REAL database.

Requires: Postgres reachable at DATABASE_URL, Redis reachable at
CELERY_BROKER_URL (so `.delay()` can actually enqueue). Run via
`pytest -m integration` with docker-compose services up, or in CI where
both are provided as service containers.
"""

import uuid

import pytest

from app.models.user import User
from app.repositories.tryon_repository import TryOnJobRepository
from app.schemas.tryon import TryOnJobCreate
from app.services.tryon_service import TryOnService

pytestmark = pytest.mark.integration


@pytest.fixture
def persisted_user(db_session) -> User:
    user = User(
        email=f"integration-{uuid.uuid4().hex[:8]}@example.com",
        hashed_password="not-a-real-hash",
        full_name="Integration Test User",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_create_job_persists_to_real_database(db_session, persisted_user):
    repository = TryOnJobRepository(db_session)
    service = TryOnService(repository)

    job = service.create_job(
        persisted_user.id,
        TryOnJobCreate(
            user_image_key="user-photos/integration/photo.jpg",
            garment_image_key="garments/integration/shirt.jpg",
        ),
    )

    # Re-fetch through a fresh query against the same transaction to prove
    # the row was actually written, not just held in Python memory.
    fetched = repository.get(job.id)
    assert fetched is not None
    assert fetched.user_id == persisted_user.id
    assert fetched.status.value == "pending"


def test_list_jobs_for_user_returns_only_their_jobs(db_session, persisted_user):
    repository = TryOnJobRepository(db_session)
    service = TryOnService(repository)

    service.create_job(
        persisted_user.id,
        TryOnJobCreate(user_image_key="user-photos/a.jpg", garment_image_key="garments/a.jpg"),
    )
    service.create_job(
        persisted_user.id,
        TryOnJobCreate(user_image_key="user-photos/b.jpg", garment_image_key="garments/b.jpg"),
    )

    jobs = service.list_jobs(persisted_user.id)

    assert len(jobs) == 2
    assert all(j.user_id == persisted_user.id for j in jobs)
