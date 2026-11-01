"""
Async try-on job processing.

Flow:
1. Load the job (must exist, should be PENDING).
2. Mark it PROCESSING.
3. Call the AI microservice's synchronous try-on endpoint, passing storage
   keys (not raw bytes) — the AI service reads/writes directly to object
   storage so large images never transit through Celery/Redis.
4. On success: mark COMPLETED and store the result_image_key.
5. On failure: mark FAILED with an error_message. Celery retry policy
   handles transient failures (network, AI service briefly unavailable).
"""

import uuid

import httpx

from app.core.config import settings
from app.core.logging_config import get_logger
from app.db.session import SessionLocal
from app.models.tryon_job import TryOnJobStatus
from app.repositories.tryon_repository import TryOnJobRepository
from app.workers.celery_app import celery_app

logger = get_logger(__name__)


@celery_app.task(
    name="tryon.process_job",
    bind=True,
    autoretry_for=(httpx.HTTPError,),
    retry_backoff=True,
    retry_backoff_max=60,
    max_retries=3,
)
def process_tryon_job(self, job_id: str) -> None:
    """
    NOTE on retries: Celery's `autoretry_for` only sees an exception that
    escapes this function, so this body must decide what the job row
    looks like before re-raising. A transient httpx error with retries
    left puts the job back to PENDING (so clients polling it keep
    polling) and re-raises for Celery to reschedule; only once retries are
    exhausted, or for a non-retryable error, is the job marked FAILED.
    """
    db = SessionLocal()
    repository = TryOnJobRepository(db)

    try:
        job = repository.get(uuid.UUID(job_id))
        if job is None:
            logger.error("TryOnJob %s not found; aborting task.", job_id)
            return

        # task_acks_late means a worker crash after completion can redeliver
        # the message — don't regenerate (and re-bill) a finished job.
        if job.status == TryOnJobStatus.COMPLETED:
            logger.info("TryOnJob %s already completed; skipping redelivery.", job_id)
            return

        repository.set_status(job, TryOnJobStatus.PROCESSING)

        response = httpx.post(
            f"{settings.AI_SERVICE_BASE_URL}api/v1/tryon/generate",
            json={
                "job_id": str(job.id),
                "user_image_key": job.user_image_key,
                "garment_image_key": job.garment_image_key,
            },
            timeout=settings.AI_SERVICE_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        result = response.json()

        repository.set_status(
            job,
            TryOnJobStatus.COMPLETED,
            result_image_key=result["result_image_key"],
            ai_model_name=result.get("model_name"),
        )
        logger.info("TryOnJob %s completed successfully.", job_id)

    except Exception as exc:  # noqa: BLE001 - every failure must leave the row consistent
        db.rollback()
        job = repository.get(uuid.UUID(job_id))
        will_retry = isinstance(exc, httpx.HTTPError) and self.request.retries < self.max_retries

        if will_retry:
            logger.warning(
                "TryOnJob %s attempt %d failed transiently; retrying.",
                job_id,
                self.request.retries + 1,
            )
            if job:
                repository.set_status(job, TryOnJobStatus.PENDING)
            raise

        logger.exception("TryOnJob %s failed permanently.", job_id)
        if job:
            repository.set_status(job, TryOnJobStatus.FAILED, error_message=str(exc))
    finally:
        db.close()
