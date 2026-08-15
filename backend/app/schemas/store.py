import uuid

from pydantic import BaseModel, ConfigDict


class StoreCreate(BaseModel):
    name: str
    slug: str


class StoreRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    logo_image_key: str | None
    is_verified: bool


class StoreDashboardSummary(BaseModel):
    """Aggregate metrics shown on the brand Store Dashboard."""

    total_products: int
    total_tryon_jobs: int
    completed_tryon_jobs: int
    failed_tryon_jobs: int
