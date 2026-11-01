"""
User domain models: end-user accounts and brand/store accounts.
"""

import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import JSON, Boolean, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.store import Store
    from app.models.tryon_job import TryOnJob
    from app.models.wardrobe import WardrobeItem


class UserRole(str, enum.Enum):
    SHOPPER = "shopper"
    BRAND_ADMIN = "brand_admin"
    PLATFORM_ADMIN = "platform_admin"


class BodyCategory(str, enum.Enum):
    """Who a body profile describes — drives which shapes and size charts apply."""

    WOMEN = "women"
    MEN = "men"
    GIRLS = "girls"
    BOYS = "boys"


# The body shapes offered for each category (the frontend's shape picker
# mirrors this list — features/shopper/body-shapes.ts). Kids' "shapes" are
# fit types, since childrenswear is sized by height, not curves.
BODY_SHAPES_BY_CATEGORY: dict[BodyCategory, tuple[str, ...]] = {
    BodyCategory.WOMEN: ("hourglass", "pear", "apple", "rectangle", "inverted_triangle"),
    BodyCategory.MEN: ("rectangle", "triangle", "inverted_triangle", "oval", "trapezoid"),
    BodyCategory.GIRLS: ("slim", "regular", "plus"),
    BodyCategory.BOYS: ("slim", "regular", "husky"),
}
KIDS_CATEGORIES = frozenset({BodyCategory.GIRLS, BodyCategory.BOYS})

# Style preferences (mirrored by the frontend's features/shopper/schemas.ts).
PREFERRED_FITS = ("slim", "regular", "relaxed", "oversized")


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"), default=UserRole.SHOPPER, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    body_profile: Mapped["BodyProfile"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    wardrobe_items: Mapped[list["WardrobeItem"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    tryon_jobs: Mapped[list["TryOnJob"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    store: Mapped["Store"] = relationship(back_populates="owner", uselist=False)


class BodyProfile(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Body measurements used for size recommendation and virtual try-on fitting."""

    __tablename__ = "body_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    height_cm: Mapped[float] = mapped_column(nullable=True)
    weight_kg: Mapped[float] = mapped_column(nullable=True)
    chest_cm: Mapped[float] = mapped_column(nullable=True)
    waist_cm: Mapped[float] = mapped_column(nullable=True)
    hip_cm: Mapped[float] = mapped_column(nullable=True)
    body_category: Mapped[BodyCategory | None] = mapped_column(
        Enum(BodyCategory, name="body_category"), nullable=True
    )
    body_shape: Mapped[str | None] = mapped_column(String(50), nullable=True)
    reference_image_key: Mapped[str] = mapped_column(String(512), nullable=True)

    # Style preferences: free-form tag lists, used by the AI Stylist.
    preferred_fit: Mapped[str | None] = mapped_column(String(20), nullable=True)
    favorite_colors: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    style_preferences: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)

    user: Mapped["User"] = relationship(back_populates="body_profile")
