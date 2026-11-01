"""
Store Dashboard endpoints.

Unlike the AI-dependent features, store/product management is plain CRUD
and is fully implemented so brands can onboard and populate their catalog.

Access: brand_admin (and platform_admin, see docs/RBAC.md) only. Every
query below is additionally scoped to the caller's own store — the role
check never substitutes for the ownership check, and cross-store access
answers 404, not 403 (docs/SECURITY.md).
"""

import uuid

from fastapi import APIRouter, Depends, Response
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.core.dependencies import get_db, require_role
from app.core.exceptions import ConflictError, NotFoundError, ValidationAppError
from app.models.product import Product, ProductVariant
from app.models.store import Store
from app.models.tryon_job import TryOnJob, TryOnJobStatus
from app.models.user import User, UserRole
from app.services.fit_feedback_service import FitFeedbackService
from app.services.size_chart_service import SizeChartService, parse_csv
from app.schemas.product import (
    ProductCreate,
    ProductRead,
    ProductUpdate,
    ProductVariantCreate,
    ProductVariantRead,
    ProductVariantUpdate,
)
from app.schemas.sizing import FitSummaryRead, SizeChartRead, SizeChartUpsert
from app.schemas.store import StoreCreate, StoreDashboardSummary, StoreRead, StoreUpdate

router = APIRouter()

require_store_manager = require_role(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)


def _get_owned_store(db: Session, user: User) -> Store:
    store = db.query(Store).filter(Store.owner_user_id == user.id).first()
    if not store:
        raise NotFoundError("No store registered for this account.")
    return store


def _get_owned_product(db: Session, store: Store, product_id: uuid.UUID) -> Product:
    product = (
        db.query(Product)
        .options(selectinload(Product.variants))
        .filter(Product.id == product_id, Product.store_id == store.id)
        .first()
    )
    if not product:
        raise NotFoundError("Product not found.")
    return product


def _get_owned_variant(db: Session, product: Product, variant_id: uuid.UUID) -> ProductVariant:
    variant = (
        db.query(ProductVariant)
        .filter(ProductVariant.id == variant_id, ProductVariant.product_id == product.id)
        .first()
    )
    if not variant:
        raise NotFoundError("Variant not found.")
    return variant


def _ensure_sku_available(db: Session, sku: str, *, exclude_variant_id: uuid.UUID | None = None):
    query = db.query(ProductVariant.id).filter(ProductVariant.sku == sku)
    if exclude_variant_id:
        query = query.filter(ProductVariant.id != exclude_variant_id)
    if query.first():
        raise ConflictError(f"SKU '{sku}' is already in use.")


@router.post("", response_model=StoreRead, status_code=201)
def create_store(
    payload: StoreCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_store_manager),
):
    if db.query(Store).filter(Store.owner_user_id == user.id).first():
        raise ConflictError("This account already has a store.")
    if db.query(Store).filter(Store.slug == payload.slug).first():
        raise ConflictError("A store with this slug already exists.")

    store = Store(owner_user_id=user.id, name=payload.name, slug=payload.slug)
    db.add(store)
    db.commit()
    db.refresh(store)
    return store


@router.get("/me", response_model=StoreRead)
def get_my_store(db: Session = Depends(get_db), user: User = Depends(require_store_manager)):
    return _get_owned_store(db, user)


@router.patch("/me", response_model=StoreRead)
def update_my_store(
    payload: StoreUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_store_manager),
):
    """Business info: name, category, description, social links, logo.
    The logo must be an image this account uploaded (its object key is
    namespaced by the uploader's id — see docs/STORAGE.md), so a store
    can't publish someone else's private photo as its logo."""
    store = _get_owned_store(db, user)
    changes = payload.model_dump(exclude_unset=True, exclude={"social_links"})
    if changes.get("name", "") is None:
        del changes["name"]  # a store always has a name

    logo_key = changes.get("logo_image_key")
    if logo_key and logo_key.split("/")[1:2] != [str(user.id)]:
        raise ValidationAppError("Upload the logo from this account before using it.")
    for field, value in changes.items():
        setattr(store, field, value)

    if payload.social_links is not None:
        links = payload.social_links.model_dump(exclude_unset=True)
        if "website" in links:
            store.website_url = str(links["website"]) if links["website"] else None
        if "instagram" in links:
            store.instagram_handle = links["instagram"] or None
        if "tiktok" in links:
            store.tiktok_handle = links["tiktok"] or None

    db.commit()
    db.refresh(store)
    return store


@router.get("/me/summary", response_model=StoreDashboardSummary)
def get_dashboard_summary(
    db: Session = Depends(get_db), user: User = Depends(require_store_manager)
):
    store = _get_owned_store(db, user)

    total_products = db.query(func.count(Product.id)).filter(Product.store_id == store.id).scalar()

    # One grouped query instead of loading every product + variant into
    # Python and issuing a COUNT per status.
    rows = (
        db.query(TryOnJob.status, func.count(TryOnJob.id))
        .join(ProductVariant, TryOnJob.product_variant_id == ProductVariant.id)
        .join(Product, ProductVariant.product_id == Product.id)
        .filter(Product.store_id == store.id)
        .group_by(TryOnJob.status)
        .tuples()
        .all()
    )
    jobs_by_status: dict[TryOnJobStatus, int] = dict(rows)

    return StoreDashboardSummary(
        total_products=total_products or 0,
        total_tryon_jobs=sum(jobs_by_status.values()),
        completed_tryon_jobs=jobs_by_status.get(TryOnJobStatus.COMPLETED, 0),
        failed_tryon_jobs=jobs_by_status.get(TryOnJobStatus.FAILED, 0),
    )


@router.post("/products", response_model=ProductRead, status_code=201)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_store_manager),
):
    store = _get_owned_store(db, user)
    product = Product(store_id=store.id, **payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/products", response_model=list[ProductRead])
def list_my_products(db: Session = Depends(get_db), user: User = Depends(require_store_manager)):
    store = _get_owned_store(db, user)
    # selectinload: ProductRead serializes variants, which would otherwise
    # lazy-load with one query per product.
    return (
        db.query(Product)
        .options(selectinload(Product.variants))
        .filter(Product.store_id == store.id)
        .order_by(Product.created_at.desc())
        .all()
    )


@router.get("/products/{product_id}", response_model=ProductRead)
def get_product(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_store_manager),
):
    return _get_owned_product(db, _get_owned_store(db, user), product_id)


@router.patch("/products/{product_id}", response_model=ProductRead)
def update_product(
    product_id: uuid.UUID,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_store_manager),
):
    product = _get_owned_product(db, _get_owned_store(db, user), product_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/products/{product_id}", status_code=204)
def delete_product(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_store_manager),
):
    """Hard delete (variants cascade; try-on jobs and wardrobe items that
    referenced a variant keep their own image keys and just lose the link).
    Use PATCH is_active=false to take a product off sale reversibly."""
    product = _get_owned_product(db, _get_owned_store(db, user), product_id)
    db.delete(product)
    db.commit()
    return Response(status_code=204)


@router.post("/products/{product_id}/variants", response_model=ProductVariantRead, status_code=201)
def create_variant(
    product_id: uuid.UUID,
    payload: ProductVariantCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_store_manager),
):
    product = _get_owned_product(db, _get_owned_store(db, user), product_id)
    _ensure_sku_available(db, payload.sku)
    variant = ProductVariant(product_id=product.id, **payload.model_dump())
    db.add(variant)
    db.commit()
    db.refresh(variant)
    return variant


@router.patch("/products/{product_id}/variants/{variant_id}", response_model=ProductVariantRead)
def update_variant(
    product_id: uuid.UUID,
    variant_id: uuid.UUID,
    payload: ProductVariantUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_store_manager),
):
    product = _get_owned_product(db, _get_owned_store(db, user), product_id)
    variant = _get_owned_variant(db, product, variant_id)
    changes = payload.model_dump(exclude_unset=True)
    if changes.get("sku"):
        _ensure_sku_available(db, changes["sku"], exclude_variant_id=variant.id)
    for field, value in changes.items():
        setattr(variant, field, value)
    db.commit()
    db.refresh(variant)
    return variant


@router.delete("/products/{product_id}/variants/{variant_id}", status_code=204)
def delete_variant(
    product_id: uuid.UUID,
    variant_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_store_manager),
):
    product = _get_owned_product(db, _get_owned_store(db, user), product_id)
    db.delete(_get_owned_variant(db, product, variant_id))
    db.commit()
    return Response(status_code=204)


# --- Size charts & fit feedback -------------------------------------------------


@router.get("/size-charts", response_model=list[SizeChartRead])
def list_size_charts(db: Session = Depends(get_db), user: User = Depends(require_store_manager)):
    return SizeChartService(db).list_for_store(_get_owned_store(db, user).id)


@router.put("/size-charts/{category}", response_model=SizeChartRead)
def upsert_size_chart(
    category: str,
    payload: SizeChartUpsert,
    db: Session = Depends(get_db),
    user: User = Depends(require_store_manager),
):
    """The brand's own measurements for one garment category (tops,
    outerwear, dresses, bottoms), as rows or CSV; replaces any existing
    chart. Recommendations for this store's products in the category use
    it whenever its size labels match the product's."""
    store = _get_owned_store(db, user)
    rows = (
        parse_csv(payload.csv)
        if payload.csv is not None
        else [row.model_dump(exclude_none=True) for row in payload.rows or []]
    )
    return SizeChartService(db).upsert(store.id, category, rows)


@router.delete("/size-charts/{category}", status_code=204)
def delete_size_chart(
    category: str, db: Session = Depends(get_db), user: User = Depends(require_store_manager)
):
    store = _get_owned_store(db, user)
    chart = SizeChartService(db).get(store.id, category)
    if not chart:
        raise NotFoundError("No size chart for this category.")
    db.delete(chart)
    db.commit()
    return Response(status_code=204)


@router.get("/products/{product_id}/fit-feedback", response_model=FitSummaryRead)
def get_product_fit_feedback(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_store_manager),
):
    """How shoppers say this product fits (runs small / true / large)."""
    product = _get_owned_product(db, _get_owned_store(db, user), product_id)
    summary = FitFeedbackService(db).summarize(product.id)
    return FitSummaryRead(**summary.__dict__, runs=summary.runs)
