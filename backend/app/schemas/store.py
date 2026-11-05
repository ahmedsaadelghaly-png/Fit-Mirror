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


class ProductDemandRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_id: uuid.UUID
    title: str
    tryons: int
    shoppers: int


class SizeDemandRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    size_label: str
    tryons: int


class StoreAnalyticsRead(BaseModel):
    """Totals only: shoppers are counted, never identified."""

    model_config = ConfigDict(from_attributes=True)

    days: int
    tryons: int
    shoppers: int
    completed: int
    saved_looks: int
    top_products: list[ProductDemandRead]
    size_demand: list[SizeDemandRead]
    # Fit reports across the catalog, all time, by verdict.
    fit_counts: dict[str, int]
