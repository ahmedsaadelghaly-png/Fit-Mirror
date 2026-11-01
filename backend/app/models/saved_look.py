"""
Saved Looks: completed try-on results a shopper has bookmarked. The images
live on the try-on job itself, so a saved look is just a labelled pointer
to one — deleting the job deletes the look with it.
"""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.tryon_job import TryOnJob


class SavedLook(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "saved_looks"
    __table_args__ = (UniqueConstraint("user_id", "tryon_job_id", name="uq_saved_looks_user_job"),)

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    tryon_job_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tryon_jobs.id", ondelete="CASCADE"), nullable=False
    )
    label: Mapped[str | None] = mapped_column(String(255), nullable=True)

    tryon_job: Mapped["TryOnJob"] = relationship(lazy="joined")

    @property
    def result_image_key(self) -> str | None:
        return self.tryon_job.result_image_key

    @property
    def garment_image_key(self) -> str:
        return self.tryon_job.garment_image_key
