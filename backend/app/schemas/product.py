import uuid
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.product import ProductAudience


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
    audience: ProductAudience
    price: Decimal
    currency: str
    primary_image_key: str | None
    is_active: bool
    is_archived: bool
    variants: list[ProductVariantRead] = []


class ProductCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    category: str = Field(min_length=1, max_length=100)
    audience: ProductAudience = ProductAudience.UNISEX
    price: Decimal = Field(ge=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    primary_image_key: str | None = None


class ProductUpdate(BaseModel):
    """Partial update — only fields present in the request body change."""

    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    category: str | None = Field(default=None, min_length=1, max_length=100)
    audience: ProductAudience | None = None
    price: Decimal | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    primary_image_key: str | None = None
    is_active: bool | None = None
    is_archived: bool | None = None


class ProductVariantCreate(BaseModel):
    size_label: str = Field(min_length=1, max_length=20)
    color: str | None = Field(default=None, max_length=50)
    sku: str = Field(min_length=1, max_length=100)
    stock_quantity: int = Field(default=0, ge=0)
    garment_image_key: str | None = None


class ProductVariantUpdate(BaseModel):
    size_label: str | None = Field(default=None, min_length=1, max_length=20)
    color: str | None = Field(default=None, max_length=50)
    sku: str | None = Field(default=None, min_length=1, max_length=100)
    stock_quantity: int | None = Field(default=None, ge=0)
    garment_image_key: str | None = None
