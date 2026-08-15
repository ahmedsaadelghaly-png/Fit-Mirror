import uuid

from app.models.tryon_job import TryOnJob, TryOnJobStatus
from app.repositories.base_repository import BaseRepository


class TryOnJobRepository(BaseRepository[TryOnJob]):
    model = TryOnJob

    def list_for_user(self, user_id: uuid.UUID, limit: int = 50) -> list[TryOnJob]:
        return (
            self.db.query(TryOnJob)
            .filter(TryOnJob.user_id == user_id)
            .order_by(TryOnJob.created_at.desc())
            .limit(limit)
            .all()
        )

    def set_status(
        self,
        job: TryOnJob,
        status: TryOnJobStatus,
        *,
        result_image_key: str | None = None,
        error_message: str | None = None,
        ai_model_name: str | None = None,
    ) -> TryOnJob:
        job.status = status
        if result_image_key is not None:
            job.result_image_key = result_image_key
        if error_message is not None:
            job.error_message = error_message
        if ai_model_name is not None:
            job.ai_model_name = ai_model_name
        return self.update(job)
