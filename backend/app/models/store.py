"""
Store domain model: represents a fashion brand/retailer using the platform.
"""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text, false
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

    # Business info shown on the store profile.
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    website_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    instagram_handle: Mapped[str | None] = mapped_column(String(100), nullable=True)
    tiktok_handle: Mapped[str | None] = mapped_column(String(100), nullable=True)

    owner: Mapped["User"] = relationship(back_populates="store")
    products: Mapped[list["Product"]] = relationship(
        back_populates="store", cascade="all, delete-orphan"
    )

    @property
    def social_links(self) -> dict[str, str | None]:
        return {
            "website": self.website_url,
            "instagram": self.instagram_handle,
            "tiktok": self.tiktok_handle,
        }
