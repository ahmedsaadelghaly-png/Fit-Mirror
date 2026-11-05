"""
Shopper fit feedback: "this runs small / true to size / large", one verdict
per shopper per product. Once enough shoppers agree, the sizing engine
shifts its recommendation one size (SizingService) and the brand sees the
summary on the product.
"""

import uuid
from dataclasses import dataclass

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, ValidationAppError
from app.models.product import Product
from app.models.sizing import FitFeedback, FitVerdict

# A product "runs small/large" once at least this many shoppers reported
# and this share of them agree.
MIN_REPORTS = 3
AGREEMENT = 0.6


@dataclass(frozen=True)
class FitSummary:
    reports: int
    small: int
    true_to_size: int
    large: int

    @property
    def runs(self) -> str | None:
        """'small' | 'large' | 'true_to_size', or None without enough agreement."""
        if self.reports < MIN_REPORTS:
            return None
        for verdict, count in (
            ("small", self.small),
            ("large", self.large),
            ("true_to_size", self.true_to_size),
        ):
            if count / self.reports >= AGREEMENT:
                return verdict
        return None


class FitFeedbackService:
    def __init__(self, db: Session):
        self.db = db

    def summarize(self, product_id: uuid.UUID) -> FitSummary:
        counts: dict[FitVerdict, int] = dict(
            self.db.query(FitFeedback.fit, func.count(FitFeedback.id))
            .filter(FitFeedback.product_id == product_id)
            .group_by(FitFeedback.fit)
            .tuples()
            .all()
        )
        small = counts.get(FitVerdict.SMALL, 0)
        true_to_size = counts.get(FitVerdict.TRUE_TO_SIZE, 0)
        large = counts.get(FitVerdict.LARGE, 0)
        return FitSummary(small + true_to_size + large, small, true_to_size, large)

    def record(
        self, user_id: uuid.UUID, product_id: uuid.UUID, size_label: str, fit: FitVerdict
    ) -> FitSummary:
        product = (
            self.db.query(Product)
            .filter(Product.id == product_id, Product.visible_to_shoppers())
            .first()
        )
        if not product:
            raise NotFoundError("Product not found.")
        labels = {variant.size_label for variant in product.variants}
        if size_label not in labels:
            raise ValidationAppError(
                f"'{size_label}' isn't one of this product's sizes ({', '.join(sorted(labels))})."
            )

        feedback = (
            self.db.query(FitFeedback)
            .filter(FitFeedback.user_id == user_id, FitFeedback.product_id == product_id)
            .first()
        )
        if feedback:
            feedback.size_label, feedback.fit = size_label, fit
        else:
            self.db.add(
                FitFeedback(user_id=user_id, product_id=product_id, size_label=size_label, fit=fit)
            )
        self.db.commit()
        return self.summarize(product_id)
