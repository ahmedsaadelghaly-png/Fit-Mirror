"""
Store Dashboard endpoints.

Unlike the AI-dependent features, store/product management is plain CRUD
and is fully implemented in Phase 1 so brands can onboard and populate
their catalog while AI features are built out in later phases.
"""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user_id, get_db
from app.core.exceptions import ConflictError, NotFoundError
from app.models.product import Product
from app.models.store import Store
from app.models.tryon_job import TryOnJob, TryOnJobStatus
from app.schemas.product import ProductCreate, ProductRead
from app.schemas.store import StoreCreate, StoreDashboardSummary, StoreRead

router = APIRouter()


def _get_owned_store(db: Session, user_id: str) -> Store:
    store = db.query(Store).filter(Store.owner_user_id == uuid.UUID(user_id)).first()
    if not store:
        raise NotFoundError("No store registered for this account.")
    return store


@router.post("", response_model=StoreRead, status_code=201)
def create_store(
    payload: StoreCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    if db.query(Store).filter(Store.slug == payload.slug).first():
        raise ConflictError("A store with this slug already exists.")

    store = Store(owner_user_id=uuid.UUID(user_id), name=payload.name, slug=payload.slug)
    db.add(store)
    db.commit()
    db.refresh(store)
    return store


@router.get("/me", response_model=StoreRead)
def get_my_store(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    return _get_owned_store(db, user_id)


@router.get("/me/summary", response_model=StoreDashboardSummary)
def get_dashboard_summary(
    db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)
):
    store = _get_owned_store(db, user_id)

    total_products = db.query(Product).filter(Product.store_id == store.id).count()

    variant_ids = [v.id for p in store.products for v in p.variants]
    job_query = db.query(TryOnJob).filter(TryOnJob.product_variant_id.in_(variant_ids))

    return StoreDashboardSummary(
        total_products=total_products,
        total_tryon_jobs=job_query.count(),
        completed_tryon_jobs=job_query.filter(TryOnJob.status == TryOnJobStatus.COMPLETED).count(),
        failed_tryon_jobs=job_query.filter(TryOnJob.status == TryOnJobStatus.FAILED).count(),
    )


@router.post("/products", response_model=ProductRead, status_code=201)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    store = _get_owned_store(db, user_id)
    product = Product(store_id=store.id, **payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/products", response_model=list[ProductRead])
def list_my_products(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    store = _get_owned_store(db, user_id)
    return db.query(Product).filter(Product.store_id == store.id).all()
