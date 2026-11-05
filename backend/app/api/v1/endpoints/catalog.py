"""
Catalog browse endpoints — the cross-store, read-only product view any
signed-in user gets (docs/RBAC.md "Products: read (public catalog
browse)"). Only active, non-archived products are visible here
(Product.visible_to_shoppers); brands manage their full catalog via
/store/products.
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from app.core.dependencies import get_current_user_id, get_db
from app.core.exceptions import NotFoundError
from app.models.product import Product, ProductAudience
from app.schemas.product import ProductRead

router = APIRouter()

ADULT_AUDIENCES = frozenset({ProductAudience.WOMEN, ProductAudience.MEN})


@router.get("/products", response_model=list[ProductRead])
def browse_products(
    ids: Annotated[list[uuid.UUID] | None, Query(max_length=50)] = None,
    category: str | None = None,
    audience: ProductAudience | None = None,
    q: str | None = Query(default=None, max_length=100),
    limit: int = Query(default=24, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    query = (
        db.query(Product)
        .options(selectinload(Product.variants))
        .filter(Product.visible_to_shoppers())
    )
    if ids:
        query = query.filter(Product.id.in_(ids))
    if category:
        query = query.filter(Product.category == category)
    if audience in ADULT_AUDIENCES:
        # Unisex items are cut for adults, so they belong under both.
        query = query.filter(Product.audience.in_((audience, ProductAudience.UNISEX)))
    elif audience:
        query = query.filter(Product.audience == audience)
    if q:
        escaped = q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        pattern = f"%{escaped}%"
        query = query.filter(
            or_(
                Product.title.ilike(pattern, escape="\\"),
                Product.description.ilike(pattern, escape="\\"),
            )
        )

    products = query.order_by(Product.created_at.desc()).offset(offset).limit(limit).all()
    if ids:
        # Preserve the caller's order (e.g. Shopping Assistant relevance rank).
        position = {product_id: index for index, product_id in enumerate(ids)}
        products.sort(key=lambda product: position.get(product.id, len(position)))
    return products


@router.get("/products/{product_id}", response_model=ProductRead)
def get_catalog_product(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    product = (
        db.query(Product)
        .options(selectinload(Product.variants))
        .filter(Product.id == product_id, Product.visible_to_shoppers())
        .first()
    )
    if not product:
        raise NotFoundError("Product not found.")
    return product
