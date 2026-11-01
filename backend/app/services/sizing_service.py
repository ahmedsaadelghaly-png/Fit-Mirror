"""
Size Recommendation engine (rule-based v1).

Matches the caller's BodyProfile measurements against a standard size
chart for the product's garment category, restricted to the sizes the
product actually stocks. Deliberately model-free: per-brand size charts
(ROADMAP "Size chart ingestion") can replace SIZE_CHART later without
changing the endpoint contract.
"""

import uuid
from dataclasses import dataclass

from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import NotFoundError, ValidationAppError
from app.models.product import Product
from app.models.user import BodyProfile

CM_PER_INCH = 2.54

# Alpha sizes, body measurements in cm: (chest, waist, hip) ranges.
SIZE_CHART: dict[str, dict[str, tuple[float, float]]] = {
    "XS": {"chest_cm": (80, 86), "waist_cm": (64, 70), "hip_cm": (86, 92)},
    "S": {"chest_cm": (86, 94), "waist_cm": (70, 78), "hip_cm": (92, 98)},
    "M": {"chest_cm": (94, 102), "waist_cm": (78, 86), "hip_cm": (98, 104)},
    "L": {"chest_cm": (102, 110), "waist_cm": (86, 94), "hip_cm": (104, 110)},
    "XL": {"chest_cm": (110, 118), "waist_cm": (94, 102), "hip_cm": (110, 116)},
    "XXL": {"chest_cm": (118, 126), "waist_cm": (102, 110), "hip_cm": (116, 122)},
}
SIZE_ORDER = list(SIZE_CHART)

# Which measurements drive the fit for each garment category.
CATEGORY_MEASUREMENTS: dict[str, tuple[str, ...]] = {
    "tops": ("chest_cm", "waist_cm"),
    "outerwear": ("chest_cm", "waist_cm"),
    "dresses": ("chest_cm", "waist_cm", "hip_cm"),
    "bottoms": ("waist_cm", "hip_cm"),
}

MEASUREMENT_LABELS = {"chest_cm": "chest", "waist_cm": "waist", "hip_cm": "hip"}


@dataclass
class SizeRecommendation:
    product_id: uuid.UUID
    recommended_size_label: str
    confidence: float
    fit_note: str


def _size_index_for(measurement: str, value: float) -> tuple[int, bool]:
    """Index of the chart size whose range contains `value`, and whether it
    actually fell inside the chart (False = clamped to the smallest/largest)."""
    for index, size in enumerate(SIZE_ORDER):
        low, high = SIZE_CHART[size][measurement]
        if low <= value < high:
            return index, True
    if value < SIZE_CHART[SIZE_ORDER[0]][measurement][0]:
        return 0, False
    return len(SIZE_ORDER) - 1, False


def _normalize_label(label: str) -> str:
    normalized = label.strip().upper()
    return {"XXS": "XS", "2XL": "XXL", "XXXL": "XXL", "3XL": "XXL"}.get(normalized, normalized)


class SizingService:
    def __init__(self, db: Session):
        self.db = db

    def recommend(self, user_id: uuid.UUID, product_id: uuid.UUID) -> SizeRecommendation:
        product = (
            self.db.query(Product)
            .options(selectinload(Product.variants))
            .filter(Product.id == product_id, Product.visible_to_shoppers())
            .first()
        )
        if not product:
            raise NotFoundError("Product not found.")

        measurements = CATEGORY_MEASUREMENTS.get(product.category.lower())
        if measurements is None:
            raise ValidationAppError(
                f"Size recommendation isn't available for {product.category} yet."
            )

        profile = self.db.query(BodyProfile).filter(BodyProfile.user_id == user_id).first()
        values = {m: getattr(profile, m) for m in measurements if profile and getattr(profile, m)}
        if not values:
            needed = " / ".join(MEASUREMENT_LABELS[m] for m in measurements)
            raise ValidationAppError(
                f"Add your {needed} measurements to your body profile to get a size recommendation."
            )

        stocked_labels = [v.size_label for v in product.variants]
        if stocked_labels and all(label.strip().isdigit() for label in stocked_labels):
            return self._recommend_numeric_waist(product, stocked_labels, values)
        return self._recommend_alpha(product, stocked_labels, values)

    def _recommend_alpha(
        self, product: Product, stocked_labels: list[str], values: dict[str, float]
    ) -> SizeRecommendation:
        ideal = {m: _size_index_for(m, v) for m, v in values.items()}
        indices = [index for index, _ in ideal.values()]
        # Fit the largest body part — a garment that's too small anywhere
        # doesn't fit; one slightly loose somewhere usually does.
        target = max(indices)

        available = {
            SIZE_ORDER.index(_normalize_label(label)): label
            for label in stocked_labels
            if _normalize_label(label) in SIZE_CHART
        }
        if stocked_labels and not available:
            raise ValidationAppError("This product's sizes don't follow a standard size chart.")
        if available:
            # Nearest stocked size, preferring the larger one on a tie.
            chosen = min(available, key=lambda index: (abs(index - target), -index))
            label = available[chosen]
        else:
            chosen, label = target, SIZE_ORDER[target]

        confidence = 0.95
        confidence -= 0.15 * (max(indices) - min(indices))
        confidence -= 0.2 * abs(chosen - target)
        confidence -= 0.1 * sum(1 for _, inside in ideal.values() if not inside)
        confidence -= 0.05 * (len(CATEGORY_MEASUREMENTS[product.category.lower()]) - len(values))

        if chosen > target:
            note = f"Your exact size isn't stocked, so {label} will fit a little loose."
        elif chosen < target:
            note = f"Your exact size isn't stocked, so {label} may fit snug."
        elif max(indices) != min(indices):
            loose = [MEASUREMENT_LABELS[m] for m, (index, _) in ideal.items() if index < target]
            note = f"Sized for your largest measurement; may be roomy at the {', '.join(loose)}."
        else:
            note = f"Your measurements fall within {label} on our size chart."

        return SizeRecommendation(product.id, label, round(max(0.3, confidence), 2), note)

    def _recommend_numeric_waist(
        self, product: Product, stocked_labels: list[str], values: dict[str, float]
    ) -> SizeRecommendation:
        """Numeric bottoms sizes (e.g. jeans "32") are the waist in inches."""
        if "waist_cm" not in values:
            raise ValidationAppError(
                "Add your waist measurement to your body profile to get a size recommendation."
            )
        waist_in = values["waist_cm"] / CM_PER_INCH
        sizes = sorted(int(label) for label in stocked_labels)
        # Smallest size that isn't tighter than the waist (half-inch grace).
        chosen = next((size for size in sizes if size >= waist_in - 0.5), sizes[-1])
        gap = chosen - waist_in

        confidence = 0.9 - 0.1 * max(0.0, abs(gap) - 1)
        if gap < -0.5:
            note = f"Your waist is about {waist_in:.0f}in — even the largest size may fit snug."
        elif gap > 1.5:
            note = f"Your waist is about {waist_in:.0f}in, so {chosen} may need a belt."
        else:
            note = f"Your waist is about {waist_in:.0f}in, which matches a {chosen}."
        return SizeRecommendation(product.id, str(chosen), round(max(0.3, confidence), 2), note)
