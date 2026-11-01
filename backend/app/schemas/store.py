import uuid

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class StoreCreate(BaseModel):
    name: str
    slug: str


class StoreSocialLinks(BaseModel):
    website: str | None = None
    instagram: str | None = None
    tiktok: str | None = None


class StoreSocialLinksUpdate(BaseModel):
    website: HttpUrl | None = None
    instagram: str | None = Field(default=None, max_length=100)
    tiktok: str | None = Field(default=None, max_length=100)


class StoreUpdate(BaseModel):
    """Partial update of the caller's own store; omitted fields are kept."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    category: str | None = Field(default=None, max_length=50)
    description: str | None = Field(default=None, max_length=2000)
    social_links: StoreSocialLinksUpdate | None = None
    logo_image_key: str | None = Field(default=None, max_length=512)


class StoreRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    logo_image_key: str | None
    is_verified: bool
    category: str | None = None
    description: str | None = None
    social_links: StoreSocialLinks = StoreSocialLinks()


class StoreDashboardSummary(BaseModel):
    """Aggregate metrics shown on the brand Store Dashboard."""

    total_products: int
    total_tryon_jobs: int
    completed_tryon_jobs: int
    failed_tryon_jobs: int
