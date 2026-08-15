"""
Smart Wardrobe domain model: user-owned garments, either uploaded personally
or saved from the product catalog.
"""

import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.user import User


class WardrobeItemSource(str, enum.Enum):
    UPLOADED = "uploaded"
    CATALOG = "catalog"


class WardrobeItem(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "wardrobe_items"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    source: Mapped[WardrobeItemSource] = mapped_column(
        Enum(WardrobeItemSource, name="wardrobe_item_source"), nullable=False
    )
    product_variant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True
    )
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    label: Mapped[str] = mapped_column(String(255), nullable=True)
    image_key: Mapped[str] = mapped_column(String(512), nullable=False)

    user: Mapped["User"] = relationship(back_populates="wardrobe_items")
