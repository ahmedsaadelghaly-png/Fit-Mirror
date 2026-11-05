"""Scheduled housekeeping, run by Celery beat (see celery_app.beat_schedule)."""

from app.core.dependencies import get_storage
from app.core.logging_config import get_logger
from app.db.session import SessionLocal
from app.services.data_retention_service import DataRetentionService
from app.workers.celery_app import celery_app

logger = get_logger(__name__)


@celery_app.task(name="maintenance.apply_data_retention")
def apply_data_retention() -> dict[str, int]:
    db = SessionLocal()
    try:
        service = DataRetentionService(db, get_storage())
        result = {
            "tryons": service.purge_expired_tryons(),
            "accounts": service.purge_deleted_accounts(),
        }
        logger.info("Data retention: %s", result)
        return result
    finally:
        db.close()
