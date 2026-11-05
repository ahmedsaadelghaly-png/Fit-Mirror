"""
Celery application instance.

Run a worker with:
    celery -A app.workers.celery_app worker --loglevel=info -Q tryon
"""

from celery import Celery

from app.core.config import settings

# Unlike the FastAPI app (whose router transitively imports every endpoint
# module, and with it every model), this worker process only ever imports
# app.workers.tasks.tryon_tasks. TryOnJob.user is declared as a string
# relationship ("User"), which SQLAlchemy only resolves the first time any
# mapper is configured — so without this import, the very first DB query
# in a task crashes with "failed to locate a name ('User')". Same registry
# this module registers for Alembic; see app/db/base_all_models.py.
from app.db import base_all_models  # noqa: E402, F401

celery_app = Celery(
    "fitmirror_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.workers.tasks.tryon_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_default_queue="tryon",
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_track_started=True,
    # Above AI_SERVICE_TIMEOUT_SECONDS (180): a hung AI call should end as a
    # retryable HTTP timeout, not a killed task.
    task_time_limit=240,
    task_soft_time_limit=210,
)
