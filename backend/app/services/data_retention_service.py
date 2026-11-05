"""
Data retention and account deletion (docs/SECURITY.md "Data retention policy").

- Try-ons older than TRYON_RETENTION_DAYS are deleted with their photo and
  result, unless the shopper saved the look.
- An account whose deletion was requested ACCOUNT_DELETION_GRACE_DAYS ago
  is erased: its stored images, then the user row, which cascades to
  everything else it owns.

Objects are always deleted before the rows that point at them. If storage
fails, the row survives and the next run tries again; the other way round
a photo could be stranded with nothing left pointing at it.
"""

from datetime import UTC, datetime, timedelta

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging_config import get_logger
from app.models.saved_look import SavedLook
from app.models.tryon_job import TryOnJob, TryOnJobStatus
from app.models.user import BodyProfile, User
from app.models.wardrobe import WardrobeItem
from app.services.storage_access import is_owned_by
from app.storage.base import ObjectStorage

logger = get_logger(__name__)

RESULT_PREFIX = "tryon-results/"
UPLOAD_NAMESPACE = "user-photos"
FINISHED = (TryOnJobStatus.COMPLETED, TryOnJobStatus.FAILED)


class AccountDeletionService:
    def __init__(self, db: Session):
        self.db = db

    def request(self, user: User) -> datetime:
        """Starts the grace period and ends the account's sessions. Logging
        in again before it runs out cancels (AuthService.authenticate)."""
        now = datetime.now(UTC)
        user.deletion_requested_at = now
        user.password_changed_at = now  # refresh tokens issued so far stop working
        self.db.commit()
        return now + timedelta(days=settings.ACCOUNT_DELETION_GRACE_DAYS)


class DataRetentionService:
    def __init__(self, db: Session, storage: ObjectStorage):
        self.db = db
        self.storage = storage

    def purge_expired_tryons(self, now: datetime | None = None) -> int:
        cutoff = (now or datetime.now(UTC)) - timedelta(days=settings.TRYON_RETENTION_DAYS)
        saved = self.db.query(SavedLook.tryon_job_id)
        jobs = (
            self.db.query(TryOnJob)
            .filter(
                TryOnJob.created_at < cutoff,
                TryOnJob.status.in_(FINISHED),
                TryOnJob.id.not_in(saved),
            )
            .all()
        )

        purged = 0
        for job in jobs:
            try:
                self._purge_job(job)
                purged += 1
            except Exception:  # noqa: BLE001 - one bad job must not stop the rest
                self.db.rollback()
                logger.exception("Could not purge try-on job %s; will retry.", job.id)
        return purged

    def purge_deleted_accounts(self, now: datetime | None = None) -> int:
        cutoff = (now or datetime.now(UTC)) - timedelta(days=settings.ACCOUNT_DELETION_GRACE_DAYS)
        users = self.db.query(User).filter(User.deletion_requested_at < cutoff).all()

        purged = 0
        for user in users:
            try:
                self._purge_account(user)
                purged += 1
            except Exception:  # noqa: BLE001 - one bad account must not stop the rest
                self.db.rollback()
                logger.exception("Could not purge account %s; will retry.", user.id)
        return purged

    def _purge_job(self, job: TryOnJob) -> None:
        if job.result_image_key and job.result_image_key.startswith(RESULT_PREFIX):
            self.storage.delete_object(job.result_image_key)
        # The same photo can back other try-ons, a profile or a wardrobe item.
        if is_owned_by(job.user_image_key, job.user_id) and not self._photo_still_used(job):
            self.storage.delete_object(job.user_image_key)
        self.db.delete(job)
        self.db.commit()

    def _photo_still_used(self, job: TryOnJob) -> bool:
        key = job.user_image_key
        return any(
            query.first() is not None
            for query in (
                self.db.query(TryOnJob.id).filter(
                    TryOnJob.user_image_key == key, TryOnJob.id != job.id
                ),
                self.db.query(BodyProfile.id).filter(BodyProfile.reference_image_key == key),
                self.db.query(WardrobeItem.id).filter(WardrobeItem.image_key == key),
            )
        )

    def _purge_account(self, user: User) -> None:
        results = (
            self.db.query(TryOnJob.result_image_key)
            .filter(TryOnJob.user_id == user.id, TryOnJob.result_image_key.is_not(None))
            .all()
        )
        for (key,) in results:
            if key.startswith(RESULT_PREFIX):
                self.storage.delete_object(key)
        self.storage.delete_prefix(f"{UPLOAD_NAMESPACE}/{user.id}/")
        # A Core delete, so the database's ON DELETE CASCADE removes the
        # store, products and the rest; the ORM would try to orphan the store.
        self.db.execute(delete(User).where(User.id == user.id))
        self.db.commit()
        logger.info("Account %s erased.", user.id)
