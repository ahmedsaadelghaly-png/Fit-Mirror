"""
Sizing data from brands and shoppers: per-brand size charts (one per store
and garment category) and shoppers' "how does it fit" feedback per product.
"""

import enum
import uuid

from sqlalchemy import JSON, Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class SizeChart(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A brand's own measurements per size, smallest size first. Each row:
    {"size_label": "M", "chest_cm": [94, 102], "waist_cm": [...], ...} —
    any of chest_cm / waist_cm / hip_cm / height_cm, as [min, max] in cm."""

    __tablename__ = "size_charts"
    __table_args__ = (UniqueConstraint("store_id", "category", name="uq_size_charts_store_cat"),)

    store_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("stores.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    rows: Mapped[list[dict]] = mapped_column(JSON, nullable=False)


class FitVerdict(str, enum.Enum):
    SMALL = "small"
    TRUE_TO_SIZE = "true_to_size"
    LARGE = "large"


class FitFeedback(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """One shopper's verdict on one product (re-reporting replaces it)."""

    __tablename__ = "fit_feedback"
    __table_args__ = (UniqueConstraint("user_id", "product_id", name="uq_fit_feedback_user_prod"),)

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    size_label: Mapped[str] = mapped_column(String(50), nullable=False)
    fit: Mapped[FitVerdict] = mapped_column(Enum(FitVerdict, name="fit_verdict"), nullable=False)
