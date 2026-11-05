"""
Product catalog models: products belong to a store and have size/color variants.
Used by Shopping Assistant, Size Recommendation, and Virtual Try-On.
"""

import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ColumnElement, Enum, ForeignKey, Numeric, String, and_, false
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.store import Store


class ProductAudience(str, enum.Enum):
    """Who a product is cut for. Kids' audiences are sized by height."""

    WOMEN = "women"
    MEN = "men"
    GIRLS = "girls"
    BOYS = "boys"
    UNISEX = "unisex"


KIDS_AUDIENCES = frozenset({ProductAudience.GIRLS, ProductAudience.BOYS})


class Product(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "products"

    store_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("stores.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    audience: Mapped[ProductAudience] = mapped_column(
        Enum(ProductAudience, name="product_audience"),
        default=ProductAudience.UNISEX,
        server_default=ProductAudience.UNISEX.name,
        nullable=False,
        index=True,
    )
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    primary_image_key: Mapped[str] = mapped_column(String(512), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # Archived = retired from the brand's working catalog (hidden from the
    # default product list and from shoppers), distinct from a temporarily
    # inactive product. Reversible, unlike DELETE.
    is_archived: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=false(), nullable=False
    )

    store: Mapped["Store"] = relationship(back_populates="products")
    variants: Mapped[list["ProductVariant"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )

    @classmethod
    def visible_to_shoppers(cls) -> ColumnElement[bool]:
        """Filter for every shopper-facing query (catalog, sizing, shopping)."""
        from app.models.store import Store  # runtime import: store.py imports this module's types

        return and_(
            cls.is_active.is_(True),
            cls.is_archived.is_(False),
            cls.store.has(Store.is_suspended.is_(False)),
        )


class ProductVariant(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "product_variants"

    product_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    size_label: Mapped[str] = mapped_column(String(20), nullable=False)
    color: Mapped[str] = mapped_column(String(50), nullable=True)
    sku: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    stock_quantity: Mapped[int] = mapped_column(default=0, nullable=False)
    garment_image_key: Mapped[str] = mapped_column(String(512), nullable=True)

    product: Mapped["Product"] = relationship(back_populates="variants")
