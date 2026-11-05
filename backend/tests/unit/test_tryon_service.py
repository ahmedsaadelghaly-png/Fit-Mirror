"""
Unit tests for TryOnService.create_job.

The Celery `.delay(...)` call is monkeypatched so this test never needs a
real Redis broker — it only asserts that job creation enqueues exactly one
task with the right job id, and that the job starts in PENDING status.
"""

import uuid
from unittest.mock import MagicMock

import pytest

from app.core.exceptions import NotFoundError, ValidationAppError
from app.models.tryon_job import TryOnJob, TryOnJobStatus
from app.schemas.tryon import TryOnJobCreate
from app.services import tryon_service as tryon_service_module
from app.services.tryon_service import TryOnService

pytestmark = pytest.mark.unit


class FakeTryOnJobRepository:
    """In-memory stand-in for TryOnJobRepository."""

    def __init__(self, product_variant=None):
        self.jobs: dict[uuid.UUID, TryOnJob] = {}
        self.db = MagicMock()
        # The service looks variants up with a visibility-filtered query.
        self.db.query.return_value.join.return_value.filter.return_value.first.return_value = (
            product_variant
        )

    def add(self, job: TryOnJob) -> TryOnJob:
        job.id = uuid.uuid4()
        self.jobs[job.id] = job
        return job

    def get(self, job_id: uuid.UUID) -> TryOnJob | None:
        return self.jobs.get(job_id)

    def list_for_user(self, user_id: uuid.UUID, limit: int = 50):
        return [j for j in self.jobs.values() if j.user_id == user_id]


@pytest.fixture(autouse=True)
def mock_celery_delay(monkeypatch):
    mock_delay = MagicMock()
    monkeypatch.setattr(tryon_service_module.process_tryon_job, "delay", mock_delay)
    return mock_delay


def test_create_job_starts_pending_and_enqueues_task(mock_celery_delay):
    repository = FakeTryOnJobRepository()
    service = TryOnService(repository)
    user_id = uuid.uuid4()

    job = service.create_job(
        user_id,
        TryOnJobCreate(
            user_image_key=f"user-photos/{user_id}/photo.jpg",
            garment_image_key=f"user-photos/{user_id}/garment.jpg",
        ),
    )

    assert job.status == TryOnJobStatus.PENDING
    assert job.user_id == user_id
    mock_celery_delay.assert_called_once_with(str(job.id))


def test_create_job_requires_garment_image_or_variant(mock_celery_delay):
    repository = FakeTryOnJobRepository()
    service = TryOnService(repository)

    user_id = uuid.uuid4()
    with pytest.raises(ValidationAppError):
        service.create_job(
            user_id, TryOnJobCreate(user_image_key=f"user-photos/{user_id}/photo.jpg")
        )

    mock_celery_delay.assert_not_called()


def test_create_job_resolves_garment_image_from_product_variant(mock_celery_delay):
    fake_variant = MagicMock()
    fake_variant.garment_image_key = "seed-data/variant-1.jpg"
    repository = FakeTryOnJobRepository(product_variant=fake_variant)
    service = TryOnService(repository)

    user_id = uuid.uuid4()
    job = service.create_job(
        user_id,
        TryOnJobCreate(
            user_image_key=f"user-photos/{user_id}/photo.jpg", product_variant_id=uuid.uuid4()
        ),
    )

    assert job.garment_image_key == "seed-data/variant-1.jpg"


def test_create_job_raises_not_found_for_missing_variant(mock_celery_delay):
    repository = FakeTryOnJobRepository(product_variant=None)
    service = TryOnService(repository)

    user_id = uuid.uuid4()
    with pytest.raises(NotFoundError):
        service.create_job(
            user_id,
            TryOnJobCreate(
                user_image_key=f"user-photos/{user_id}/photo.jpg", product_variant_id=uuid.uuid4()
            ),
        )


def test_get_job_raises_not_found_for_other_users_job(mock_celery_delay):
    repository = FakeTryOnJobRepository()
    service = TryOnService(repository)
    owner_id = uuid.uuid4()

    job = service.create_job(
        owner_id,
        TryOnJobCreate(
            user_image_key=f"user-photos/{owner_id}/photo.jpg",
            garment_image_key="seed-data/g.jpg",
        ),
    )

    with pytest.raises(NotFoundError):
        service.get_job(uuid.uuid4(), job.id)  # different user_id

    # The rightful owner can still fetch it.
    assert service.get_job(owner_id, job.id).id == job.id
