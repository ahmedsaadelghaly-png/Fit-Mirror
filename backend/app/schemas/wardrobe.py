import uuid

from pydantic import BaseModel, ConfigDict

from app.models.wardrobe import WardrobeItemSource


class WardrobeItemCreate(BaseModel):
    source: WardrobeItemSource
    category: str
    label: str | None = None
    product_variant_id: uuid.UUID | None = None
    image_key: str


class WardrobeItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    source: WardrobeItemSource
    category: str
    label: str | None
    image_key: str
