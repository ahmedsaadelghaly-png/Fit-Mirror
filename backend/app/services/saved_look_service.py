import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError, ValidationAppError
from app.models.saved_look import SavedLook
from app.models.tryon_job import TryOnJob, TryOnJobStatus
from app.schemas.saved_look import SavedLookCreate


class SavedLookService:
    def __init__(self, db: Session):
        self.db = db

    def list_looks(self, user_id: uuid.UUID) -> list[SavedLook]:
        return (
            self.db.query(SavedLook)
            .filter(SavedLook.user_id == user_id)
            .order_by(SavedLook.created_at.desc())
            .all()
        )

    def save(self, user_id: uuid.UUID, payload: SavedLookCreate) -> SavedLook:
        job = (
            self.db.query(TryOnJob)
            .filter(TryOnJob.id == payload.tryon_job_id, TryOnJob.user_id == user_id)
            .first()
        )
        if not job:
            raise NotFoundError("Try-on job not found.")
        if job.status != TryOnJobStatus.COMPLETED:
            raise ValidationAppError("Only a completed try-on can be saved as a look.")
        exists = (
            self.db.query(SavedLook.id)
            .filter(SavedLook.user_id == user_id, SavedLook.tryon_job_id == job.id)
            .first()
        )
        if exists:
            raise ConflictError("This look is already saved.")

        look = SavedLook(user_id=user_id, tryon_job_id=job.id, label=payload.label)
        self.db.add(look)
        self.db.commit()
        self.db.refresh(look)
        return look

    def delete(self, user_id: uuid.UUID, look_id: uuid.UUID) -> None:
        look = (
            self.db.query(SavedLook)
            .filter(SavedLook.id == look_id, SavedLook.user_id == user_id)
            .first()
        )
        if not look:
            raise NotFoundError("Saved look not found.")
        self.db.delete(look)
        self.db.commit()
