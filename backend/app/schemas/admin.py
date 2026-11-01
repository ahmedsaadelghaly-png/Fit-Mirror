import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.tryon_job import TryOnJobStatus
from app.models.user import UserRole


class AdminUserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    full_name: str | None
    role: UserRole
    is_active: bool
    created_at: datetime


class AdminUserUpdate(BaseModel):
    role: UserRole | None = None
    is_active: bool | None = None


class AdminStoreRead(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    is_verified: bool
    is_suspended: bool
    owner_user_id: uuid.UUID
    owner_email: EmailStr
    product_count: int
    created_at: datetime


class AdminStoreUpdate(BaseModel):
    is_verified: bool | None = None
    is_suspended: bool | None = None


class AdminTryOnJobRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    user_email: EmailStr
    product_variant_id: uuid.UUID | None
    # Only set when the job used a catalog garment (product_variant_id).
    store_name: str | None
    user_image_key: str
    garment_image_key: str
    result_image_key: str | None
    status: TryOnJobStatus
    ai_model_name: str | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime


class PlatformStats(BaseModel):
    users_by_role: dict[str, int]
    active_users: int
    total_stores: int
    verified_stores: int
    total_products: int
    active_products: int
    tryon_jobs_by_status: dict[str, int]
