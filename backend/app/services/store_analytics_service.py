"""
Brand analytics: what shoppers do with a store's catalog.

Only totals leave this module, never a shopper's identity. The window is
capped at TRYON_RETENTION_DAYS because older try-ons no longer exist.
Purchases and product views aren't tracked anywhere, so there is no
conversion metric here.
"""

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Query, Session

from app.models.product import Product, ProductVariant
from app.models.saved_look import SavedLook
from app.models.sizing import FitFeedback, FitVerdict
from app.models.tryon_job import TryOnJob, TryOnJobStatus

TOP_PRODUCTS = 10


@dataclass(frozen=True)
class ProductDemand:
    product_id: uuid.UUID
    title: str
    tryons: int
    shoppers: int


@dataclass(frozen=True)
class SizeDemand:
    size_label: str
    tryons: int


@dataclass(frozen=True)
class StoreAnalytics:
    days: int
    tryons: int
    shoppers: int
    completed: int
    saved_looks: int
    top_products: list[ProductDemand]
    size_demand: list[SizeDemand]
    fit_counts: dict[str, int]


class StoreAnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def summarize(self, store_id: uuid.UUID, days: int) -> StoreAnalytics:
        since = datetime.now(UTC) - timedelta(days=days)
        tryons, shoppers = self._jobs(
            store_id, since, func.count(TryOnJob.id), func.count(TryOnJob.user_id.distinct())
        ).one()
        completed = (
            self._jobs(store_id, since, func.count(TryOnJob.id))
            .filter(TryOnJob.status == TryOnJobStatus.COMPLETED)
            .scalar()
        )
        saved_looks = (
            self._jobs(store_id, since, func.count(SavedLook.id))
            .join(SavedLook, SavedLook.tryon_job_id == TryOnJob.id)
            .scalar()
        )
        return StoreAnalytics(
            days=days,
            tryons=tryons,
            shoppers=shoppers,
            completed=completed,
            saved_looks=saved_looks,
            top_products=self._top_products(store_id, since),
            size_demand=self._size_demand(store_id, since),
            fit_counts=self._fit_counts(store_id),
        )

    def _jobs(self, store_id: uuid.UUID, since: datetime, *columns) -> Query:
        return (
            self.db.query(*columns)
            .select_from(TryOnJob)
            .join(ProductVariant, TryOnJob.product_variant_id == ProductVariant.id)
            .join(Product, ProductVariant.product_id == Product.id)
            .filter(Product.store_id == store_id, TryOnJob.created_at >= since)
        )

    def _top_products(self, store_id: uuid.UUID, since: datetime) -> list[ProductDemand]:
        tryons = func.count(TryOnJob.id)
        rows = (
            self._jobs(
                store_id,
                since,
                Product.id,
                Product.title,
                tryons,
                func.count(TryOnJob.user_id.distinct()),
            )
            .group_by(Product.id, Product.title)
            .order_by(tryons.desc(), Product.title)
            .limit(TOP_PRODUCTS)
            .all()
        )
        return [ProductDemand(*row) for row in rows]

    def _size_demand(self, store_id: uuid.UUID, since: datetime) -> list[SizeDemand]:
        tryons = func.count(TryOnJob.id)
        rows = (
            self._jobs(store_id, since, ProductVariant.size_label, tryons)
            .group_by(ProductVariant.size_label)
            .order_by(tryons.desc(), ProductVariant.size_label)
            .all()
        )
        return [SizeDemand(*row) for row in rows]

    def _fit_counts(self, store_id: uuid.UUID) -> dict[str, int]:
        rows = (
            self.db.query(FitFeedback.fit, func.count(FitFeedback.id))
            .join(Product, FitFeedback.product_id == Product.id)
            .filter(Product.store_id == store_id)
            .group_by(FitFeedback.fit)
            .all()
        )
        counts = {verdict.value: 0 for verdict in FitVerdict}
        counts.update({verdict.value: total for verdict, total in rows})
        return counts
