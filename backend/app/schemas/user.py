import uuid

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.user import UserRole


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    full_name: str | None
    role: UserRole
    is_active: bool


class BodyProfileUpsert(BaseModel):
    height_cm: float | None = None
    weight_kg: float | None = None
    chest_cm: float | None = None
    waist_cm: float | None = None
    hip_cm: float | None = None
    body_shape: str | None = None


class BodyProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    height_cm: float | None
    weight_kg: float | None
    chest_cm: float | None
    waist_cm: float | None
    hip_cm: float | None
    body_shape: str | None
    reference_image_key: str | None
