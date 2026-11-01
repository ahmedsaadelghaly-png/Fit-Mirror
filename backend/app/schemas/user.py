import uuid
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints

from app.models.user import BodyCategory, UserRole

PreferredFit = Literal["slim", "regular", "relaxed", "oversized"]
StyleTag = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=40)]


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    full_name: str | None
    role: UserRole
    is_active: bool


class BodyProfileUpsert(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    body_category: BodyCategory | None = None
    height_cm: float | None = None
    weight_kg: float | None = None
    chest_cm: float | None = None
    waist_cm: float | None = None
    hip_cm: float | None = None
    body_shape: str | None = None
    reference_image_key: str | None = Field(default=None, max_length=512)
    preferred_fit: PreferredFit | None = None
    favorite_colors: list[StyleTag] | None = Field(default=None, max_length=12)
    style_preferences: list[StyleTag] | None = Field(default=None, max_length=12)


class BodyProfileCreate(BodyProfileUpsert):
    """A family member's profile (e.g. a child): a name is required."""

    name: str = Field(min_length=1, max_length=100)


class BodyProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    is_primary: bool
    body_category: BodyCategory | None
    height_cm: float | None
    weight_kg: float | None
    chest_cm: float | None
    waist_cm: float | None
    hip_cm: float | None
    body_shape: str | None
    reference_image_key: str | None
    preferred_fit: str | None
    favorite_colors: list[str]
    style_preferences: list[str]
