import uuid
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ProductVariantRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    size_label: str
    color: str | None
    sku: str
    stock_quantity: int
    garment_image_key: str | None


class ProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: str | None
    category: str
    price: Decimal
    currency: str
    primary_image_key: str | None
    is_active: bool
    variants: list[ProductVariantRead] = []


class ProductCreate(BaseModel):
    title: str
    description: str | None = None
    category: str
    price: Decimal
    currency: str = "USD"
    primary_image_key: str | None = None
