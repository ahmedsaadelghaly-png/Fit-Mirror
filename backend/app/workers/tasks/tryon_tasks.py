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

# Catalog categories -> the garment categories try-on models understand.
GARMENT_CATEGORIES = {
    "tops": "upper_body",
    "outerwear": "upper_body",
    "bottoms": "lower_body",
    "dresses": "dresses",
}


# Shown to shoppers. The real cause stays in the logs: it can be a raw HTTP
# error, and a shopper can't act on it anyway.
GENERATION_FAILED = "We couldn't generate this try-on. Please try again."


class TryOnRejected(Exception):
    """The AI service refused the inputs (4xx): permanent, not retried. The
    message is shopper-facing (e.g. "The photo is too small ...")."""


class GenerationFailed(Exception):
    """The AI service tried and every model failed (500). Not retried: each
    attempt is a new paid model run, and the shopper can simply try again."""


def _garment_hints(job) -> dict[str, str]:
    variant = job.product_variant
    if variant is None:
        return {"garment_category": job.garment_category} if job.garment_category else {}
    product = variant.product
    hints = {"garment_description": product.title}
    if category := GARMENT_CATEGORIES.get(product.category.lower()):
        hints["garment_category"] = category
    return hints


def _rejection_message(response: httpx.Response) -> str:
    try:
        detail = response.json().get("detail")
    except ValueError:
        detail = None
    return detail if isinstance(detail, str) else "This photo couldn't be used for a try-on."


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
                **_garment_hints(job),
            },
            timeout=settings.AI_SERVICE_TIMEOUT_SECONDS,
        )
        if 400 <= response.status_code < 500:
            raise TryOnRejected(_rejection_message(response))
        if response.status_code == 500:
            raise GenerationFailed(response.text[:500])
        response.raise_for_status()
        result = response.json()

        repository.set_status(
            job,
            TryOnJobStatus.COMPLETED,
            result_image_key=result["result_image_key"],
            ai_model_name=result.get("model_name"),
        )
        if result.get("fallback_from"):
            logger.warning(
                "TryOnJob %s: %s failed, %s produced the result.",
                job_id,
                result["fallback_from"],
                result.get("model_name"),
            )
        logger.info("TryOnJob %s completed successfully.", job_id)

    except Exception as exc:  # noqa: BLE001 - every failure must leave the row consistent
        db.rollback()
        job = repository.get(uuid.UUID(job_id))
        # After a read timeout the AI service may still be running the job, so
        # a retry could pay for a second run.
        retryable = isinstance(exc, httpx.HTTPError) and not isinstance(exc, httpx.ReadTimeout)
        will_retry = retryable and self.request.retries < self.max_retries

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
            message = str(exc) if isinstance(exc, TryOnRejected) else GENERATION_FAILED
            repository.set_status(job, TryOnJobStatus.FAILED, error_message=message)
    finally:
        db.close()
