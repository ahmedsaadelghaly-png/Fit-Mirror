"""
Platform Admin endpoints (platform_admin only — docs/RBAC.md).

Separate /admin/* routes rather than extra powers on existing routes
("platform_admin is additive, not a bypass switch"). Every handler takes
the admin through require_role, so a shopper/brand token gets 403.
"""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, require_role
from app.core.exceptions import NotFoundError, ValidationAppError
from app.models.product import Product, ProductVariant
from app.models.store import Store
from app.models.tryon_job import TryOnJob, TryOnJobStatus
from app.models.user import User, UserRole
from app.schemas.admin import (
    AdminStoreRead,
    AdminStoreUpdate,
    AdminTryOnJobRead,
    AdminUserRead,
    AdminUserUpdate,
    PlatformStats,
)
from app.workers.tasks.tryon_tasks import process_tryon_job

router = APIRouter()

require_platform_admin = require_role(UserRole.PLATFORM_ADMIN)


@router.get("/stats", response_model=PlatformStats)
def get_platform_stats(
    db: Session = Depends(get_db), admin: User = Depends(require_platform_admin)
):
    users_by_role: dict[UserRole, int] = dict(
        db.query(User.role, func.count(User.id)).group_by(User.role).tuples().all()
    )
    jobs_by_status: dict[TryOnJobStatus, int] = dict(
        db.query(TryOnJob.status, func.count(TryOnJob.id)).group_by(TryOnJob.status).tuples().all()
    )
    return PlatformStats(
        users_by_role={role.value: users_by_role.get(role, 0) for role in UserRole},
        active_users=db.query(func.count(User.id)).filter(User.is_active.is_(True)).scalar(),
        total_stores=db.query(func.count(Store.id)).scalar(),
        verified_stores=db.query(func.count(Store.id)).filter(Store.is_verified.is_(True)).scalar(),
        total_products=db.query(func.count(Product.id)).scalar(),
        active_products=db.query(func.count(Product.id))
        .filter(Product.is_active.is_(True))
        .scalar(),
        tryon_jobs_by_status={s.value: jobs_by_status.get(s, 0) for s in TryOnJobStatus},
    )


@router.get("/users", response_model=list[AdminUserRead])
def list_users(
    q: str | None = Query(default=None, max_length=100),
    role: UserRole | None = None,
    is_active: bool | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    admin: User = Depends(require_platform_admin),
):
    query = db.query(User)
    if q:
        pattern = f"%{q.lower()}%"
        query = query.filter(
            or_(func.lower(User.email).like(pattern), func.lower(User.full_name).like(pattern))
        )
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active.is_(is_active))
    return query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()


@router.patch("/users/{user_id}", response_model=AdminUserRead)
def update_user(
    user_id: uuid.UUID,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_platform_admin),
):
    user = db.get(User, user_id)
    if not user:
        raise NotFoundError("User not found.")
    # Guard against an admin locking themselves (possibly the last admin)
    # out of the admin surface.
    if user.id == admin.id and (
        payload.is_active is False
        or (payload.role is not None and payload.role != UserRole.PLATFORM_ADMIN)
    ):
        raise ValidationAppError("You can't deactivate or demote your own account.")

    for field, value in payload.model_dump(exclude_unset=True, exclude_none=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.get("/stores", response_model=list[AdminStoreRead])
def list_stores(
    is_verified: bool | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    admin: User = Depends(require_platform_admin),
):
    product_counts = (
        db.query(Product.store_id, func.count(Product.id).label("product_count"))
        .group_by(Product.store_id)
        .subquery()
    )
    query = (
        db.query(Store, User.email, func.coalesce(product_counts.c.product_count, 0))
        .join(User, Store.owner_user_id == User.id)
        .outerjoin(product_counts, product_counts.c.store_id == Store.id)
    )
    if is_verified is not None:
        query = query.filter(Store.is_verified.is_(is_verified))
    rows = query.order_by(Store.created_at.desc()).offset(offset).limit(limit).all()
    return [_store_read(store, email, count) for store, email, count in rows]


@router.patch("/stores/{store_id}", response_model=AdminStoreRead)
def update_store(
    store_id: uuid.UUID,
    payload: AdminStoreUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_platform_admin),
):
    store = db.get(Store, store_id)
    if not store:
        raise NotFoundError("Store not found.")
    for field, value in payload.model_dump(exclude_unset=True, exclude_none=True).items():
        setattr(store, field, value)
    db.commit()
    db.refresh(store)
    count = db.query(func.count(Product.id)).filter(Product.store_id == store.id).scalar()
    return _store_read(store, store.owner.email, count or 0)


@router.get("/tryon-jobs", response_model=list[AdminTryOnJobRead])
def list_tryon_jobs(
    status: TryOnJobStatus | None = None,
    user_id: uuid.UUID | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    admin: User = Depends(require_platform_admin),
):
    # One query: the job's owner email, plus the store name for jobs that
    # used a catalog garment (outer joins — uploaded garments have none).
    query = (
        db.query(TryOnJob, User.email, Store.name)
        .join(User, TryOnJob.user_id == User.id)
        .outerjoin(ProductVariant, TryOnJob.product_variant_id == ProductVariant.id)
        .outerjoin(Product, ProductVariant.product_id == Product.id)
        .outerjoin(Store, Product.store_id == Store.id)
    )
    if status:
        query = query.filter(TryOnJob.status == status)
    if user_id:
        query = query.filter(TryOnJob.user_id == user_id)
    rows = query.order_by(TryOnJob.created_at.desc()).offset(offset).limit(limit).all()
    return [_job_read(job, email, store_name) for job, email, store_name in rows]


@router.post("/tryon-jobs/{job_id}/retry", response_model=AdminTryOnJobRead)
def retry_tryon_job(
    job_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(require_platform_admin),
):
    """Re-queues a FAILED job with its original inputs (e.g. after an AI
    service outage). Only failed jobs can be retried — anything else is
    either still in flight or already has a result."""
    job = db.get(TryOnJob, job_id)
    if not job:
        raise NotFoundError("Try-on job not found.")
    if job.status != TryOnJobStatus.FAILED:
        raise ValidationAppError(
            f"Only failed jobs can be retried (this one is {job.status.value})."
        )

    job.status = TryOnJobStatus.PENDING
    job.error_message = None
    db.commit()
    process_tryon_job.delay(str(job.id))

    store_name = (
        db.query(Store.name)
        .join(Product, Product.store_id == Store.id)
        .join(ProductVariant, ProductVariant.product_id == Product.id)
        .filter(ProductVariant.id == job.product_variant_id)
        .scalar()
        if job.product_variant_id
        else None
    )
    return _job_read(job, job.user.email, store_name)


def _store_read(store: Store, owner_email: str, product_count: int) -> AdminStoreRead:
    return AdminStoreRead(
        id=store.id,
        name=store.name,
        slug=store.slug,
        is_verified=store.is_verified,
        is_suspended=store.is_suspended,
        owner_user_id=store.owner_user_id,
        owner_email=owner_email,
        product_count=product_count,
        created_at=store.created_at,
    )


def _job_read(job: TryOnJob, user_email: str, store_name: str | None) -> AdminTryOnJobRead:
    return AdminTryOnJobRead(
        id=job.id,
        user_id=job.user_id,
        user_email=user_email,
        product_variant_id=job.product_variant_id,
        store_name=store_name,
        user_image_key=job.user_image_key,
        garment_image_key=job.garment_image_key,
        result_image_key=job.result_image_key,
        status=job.status,
        ai_model_name=job.ai_model_name,
        error_message=job.error_message,
        created_at=job.created_at,
        updated_at=job.updated_at,
    )
