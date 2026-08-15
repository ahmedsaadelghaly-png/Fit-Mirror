"""
Virtual Try-On orchestration service.

Responsibility boundary (Clean Architecture):
- This service ONLY creates the job record and enqueues async work.
- It never calls the AI service directly and never blocks the request.
- Actual AI orchestration happens in app/workers/tasks/tryon_tasks.py,
  which is free to be retried, scaled, and monitored independently of
  the web process.
"""

import uuid

from app.core.exceptions import NotFoundError, ValidationAppError
from app.models.product import ProductVariant
from app.models.tryon_job import TryOnJob, TryOnJobStatus
from app.repositories.tryon_repository import TryOnJobRepository
from app.schemas.tryon import TryOnJobCreate
from app.workers.tasks.tryon_tasks import process_tryon_job


class TryOnService:
    def __init__(self, repository: TryOnJobRepository):
        self.repository = repository

    def create_job(self, user_id: uuid.UUID, payload: TryOnJobCreate) -> TryOnJob:
        garment_image_key = payload.garment_image_key

        if not garment_image_key and payload.product_variant_id:
            variant = self.repository.db.get(ProductVariant, payload.product_variant_id)
            if not variant:
                raise NotFoundError("Product variant not found.")
            garment_image_key = variant.garment_image_key

        if not garment_image_key:
            raise ValidationAppError(
                "Either garment_image_key or product_variant_id must be provided."
            )

        job = TryOnJob(
            user_id=user_id,
            product_variant_id=payload.product_variant_id,
            user_image_key=payload.user_image_key,
            garment_image_key=garment_image_key,
            status=TryOnJobStatus.PENDING,
        )
        job = self.repository.add(job)

        # Enqueue async processing — the API responds immediately with
        # status=PENDING; the worker takes it from here.
        process_tryon_job.delay(str(job.id))

        return job

    def get_job(self, user_id: uuid.UUID, job_id: uuid.UUID) -> TryOnJob:
        job = self.repository.get(job_id)
        if not job or job.user_id != user_id:
            raise NotFoundError("Try-on job not found.")
        return job

    def list_jobs(self, user_id: uuid.UUID) -> list[TryOnJob]:
        return self.repository.list_for_user(user_id)
