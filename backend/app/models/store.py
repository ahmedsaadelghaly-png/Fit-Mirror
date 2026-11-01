"""
Store domain model: represents a fashion brand/retailer using the platform.
"""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, false
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.product import Product
    from app.models.user import User


class Store(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "stores"

    owner_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    logo_image_key: Mapped[str] = mapped_column(String(512), nullable=True)
    is_verified: Mapped[bool] = mapped_column(default=False, nullable=False)
    # Set by a platform admin; a suspended store's products disappear from
    # every shopper-facing surface (see Product.visible_to_shoppers).
    is_suspended: Mapped[bool] = mapped_column(
        default=False, server_default=false(), nullable=False
    )

    owner: Mapped["User"] = relationship(back_populates="store")
    products: Mapped[list["Product"]] = relationship(
        back_populates="store", cascade="all, delete-orphan"
    )
