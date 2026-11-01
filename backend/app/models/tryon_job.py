"""
Virtual Try-On job model.

Every try-on request creates a TryOnJob row immediately (status=PENDING) and is
processed asynchronously by a Celery worker, which calls the AI service and
writes the resulting image reference back onto this row.
"""

import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.product import ProductVariant
    from app.models.user import User


class TryOnJobStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class TryOnJob(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "tryon_jobs"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_variant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True
    )

    # Input references (object storage keys, not raw binary data).
    user_image_key: Mapped[str] = mapped_column(String(512), nullable=False)
    garment_image_key: Mapped[str] = mapped_column(String(512), nullable=False)

    status: Mapped[TryOnJobStatus] = mapped_column(
        Enum(TryOnJobStatus, name="tryon_job_status"),
        default=TryOnJobStatus.PENDING,
        nullable=False,
        index=True,
    )

    # Which replaceable AI pipeline/model handled (or will handle) this job.
    ai_model_name: Mapped[str] = mapped_column(String(100), nullable=True)

    # Output reference — populated only once status == COMPLETED.
    result_image_key: Mapped[str] = mapped_column(String(512), nullable=True)

    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    user: Mapped["User"] = relationship(back_populates="tryon_jobs")
    product_variant: Mapped["ProductVariant | None"] = relationship()

    @property
    def product_title(self) -> str | None:
        """The catalog product tried on, if this was a catalog try-on."""
        return self.product_variant.product.title if self.product_variant else None

    @property
    def size_label(self) -> str | None:
        return self.product_variant.size_label if self.product_variant else None
