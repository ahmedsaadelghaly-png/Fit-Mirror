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
from app.models.product import KIDS_AUDIENCES, Product, ProductVariant
from app.models.tryon_job import TryOnJob, TryOnJobStatus
from app.models.user import KIDS_CATEGORIES
from app.repositories.tryon_repository import TryOnJobRepository
from app.schemas.tryon import TryOnJobCreate
from app.services.body_profile_service import BodyProfileService
from app.services.storage_access import StorageAccess, is_owned_by
from app.workers.tasks.tryon_tasks import process_tryon_job

# Children's photos aren't sent to the try-on model. Their profiles keep size
# recommendations; see docs/SECURITY.md "Children's data".
KIDS_TRYON_UNAVAILABLE = "Photo try-on isn't available for children. Size checks still work."


class TryOnService:
    def __init__(self, repository: TryOnJobRepository):
        self.repository = repository

    def create_job(self, user_id: uuid.UUID, payload: TryOnJobCreate) -> TryOnJob:
        garment_image_key = payload.garment_image_key

        if not is_owned_by(payload.user_image_key, user_id):
            raise ValidationAppError("Upload the photo from this account first.")
        if payload.body_profile_id:
            profile = BodyProfileService(self.repository.db).get_owned(
                user_id, payload.body_profile_id
            )
            if profile.body_category in KIDS_CATEGORIES:
                raise ValidationAppError(KIDS_TRYON_UNAVAILABLE)

        if payload.product_variant_id:
            variant = (
                self.repository.db.query(ProductVariant)
                .join(ProductVariant.product)
                .filter(
                    ProductVariant.id == payload.product_variant_id,
                    Product.visible_to_shoppers(),
                )
                .first()
            )
            if not variant:
                raise NotFoundError("Product variant not found.")
            if variant.product.audience in KIDS_AUDIENCES:
                raise ValidationAppError(KIDS_TRYON_UNAVAILABLE)
            # A variant without its own garment shot uses the product photo.
            garment_image_key = garment_image_key or (
                variant.garment_image_key or variant.product.primary_image_key
            )

        if not garment_image_key:
            raise ValidationAppError(
                "Either garment_image_key or product_variant_id must be provided."
            )

        if not StorageAccess(self.repository.db).can_read(user_id, garment_image_key):
            raise ValidationAppError("That garment image isn't available.")

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
