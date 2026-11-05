"""
Size Recommendation engine.

Matches a body profile's measurements against a size chart for the
product's garment category, restricted to the sizes the product stocks:

1. The brand's own chart for that category, when it has uploaded one
   (SizeChartService) and its size labels match the product's.
2. Otherwise the standard chart below (or, for kids, age/height labels).

Then shopper fit feedback adjusts the result: once enough shoppers agree a
product runs small (or large), the recommendation moves one stocked size
up (or down) and the note says why (FitFeedbackService).
"""

import re
import uuid
from dataclasses import dataclass, replace

from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import NotFoundError, ValidationAppError
from app.models.product import Product, ProductAudience
from app.models.sizing import SizeChart
from app.models.user import KIDS_CATEGORIES, BodyProfile
from app.services.body_profile_service import BodyProfileService
from app.services.fit_feedback_service import FitFeedbackService, FitSummary
from app.services.size_chart_service import SizeChartService

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

KIDS_AUDIENCES = frozenset({ProductAudience.GIRLS, ProductAudience.BOYS})

# Childrenswear is sized by height. Age sizes ("6Y", "6-7 years") map to the
# tallest child they fit (EU childrenswear convention); height sizes ("116",
# "110-116") already are that height in cm.
KIDS_AGE_MAX_HEIGHT_CM = {
    2: 92, 3: 98, 4: 104, 5: 110, 6: 116, 7: 122, 8: 128, 9: 134,
    10: 140, 11: 146, 12: 152, 13: 158, 14: 164, 15: 170, 16: 176,
}  # fmt: skip
KIDS_LABEL = re.compile(r"(\d{1,3})\s*(?:-\s*(\d{1,3}))?\s*(?:y|yr|yrs|years?)?")
# Fit types that size up one step for comfort.
KIDS_SIZE_UP_FITS = frozenset({"plus", "husky"})

# Numeric bottoms (jeans "32") are sized by waist alone, so the hip-based
# tips below would be wrong there.
WAIST_SIZED_TIPS: dict[str, str] = {
    "pear": "For a pear shape, check the hip fit — jeans sizes go by waist, so size up if snug.",
    "triangle": "For a triangle shape, check the seat — jeans sizes go by waist.",
}

# One short, shape-aware tip per (body shape, garment category).
SHAPE_TIPS: dict[tuple[str, str], str] = {
    ("pear", "bottoms"): "For a pear shape we sized to your hips — the waist may need taking in.",
    ("pear", "dresses"): "For a pear shape, A-line and wrap cuts flatter most.",
    ("apple", "tops"): "For an apple shape, a relaxed fit through the middle is most comfortable.",
    ("apple", "dresses"): "For an apple shape, empire-waist cuts are most comfortable.",
    ("hourglass", "dresses"): "For an hourglass shape, look for a defined waist.",
    ("hourglass", "tops"): "For an hourglass shape, fitted or wrap styles show your waist.",
    ("inverted_triangle", "tops"): "We sized to your shoulders and chest — the waist may be roomy.",
    ("inverted_triangle", "outerwear"): "We sized to your shoulders — check the sleeve length.",
    ("triangle", "bottoms"): "For a triangle shape we sized to your hips and seat.",
    ("oval", "tops"): "For an oval shape, consider a regular or relaxed fit over slim.",
    ("oval", "outerwear"): "For an oval shape, leave room to layer — size up if between sizes.",
    ("trapezoid", "tops"): "For a trapezoid shape, slim and regular fits both work well.",
}


@dataclass
class SizeRecommendation:
    product_id: uuid.UUID
    recommended_size_label: str
    confidence: float
    fit_note: str
    # Whose profile the size was computed for (family profiles).
    body_profile_id: uuid.UUID | None = None
    profile_name: str | None = None
    # "brand" when the brand's own size chart was used, else "standard".
    size_chart: str = "standard"
    fit_feedback: FitSummary | None = None


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


def _standard_size_key(label: str) -> tuple[int, float, str]:
    """Orders size labels smallest first: alpha, numeric, then kids' sizes."""
    normalized = _normalize_label(label)
    if normalized in SIZE_CHART:
        return (0, SIZE_ORDER.index(normalized), "")
    if label.strip().isdigit():
        return (1, int(label), "")
    match = KIDS_LABEL.fullmatch(label.strip().lower())
    if match:
        upper = int(match.group(2) or match.group(1))
        return (2, upper if upper >= 80 else KIDS_AGE_MAX_HEIGHT_CM.get(upper, upper), "")
    return (3, 0, label)


class SizingService:
    def __init__(self, db: Session):
        self.db = db

    def recommend(
        self,
        user_id: uuid.UUID,
        product_id: uuid.UUID,
        body_profile_id: uuid.UUID | None = None,
    ) -> SizeRecommendation:
        """Sizes `product_id` for one of the caller's body profiles — the
        given family profile, or their own (primary) one by default."""
        profile = BodyProfileService(self.db).resolve(user_id, body_profile_id)
        product = (
            self.db.query(Product)
            .options(selectinload(Product.variants))
            .filter(Product.id == product_id, Product.visible_to_shoppers())
            .first()
        )
        if not product:
            raise NotFoundError("Product not found.")

        chart = SizeChartService(self.db).get(product.store_id, product.category)
        result = self._recommend(product, profile, chart)
        result = self._apply_fit_feedback(product, chart, result)
        if profile is None:
            return result
        return replace(result, body_profile_id=profile.id, profile_name=profile.name)

    def _recommend(
        self, product: Product, profile: BodyProfile | None, chart: SizeChart | None
    ) -> SizeRecommendation:
        is_kids_profile = bool(profile and profile.body_category in KIDS_CATEGORIES)

        if product.audience in KIDS_AUDIENCES:
            if not profile or not is_kids_profile:
                raise ValidationAppError(
                    f"This is a {product.audience.value}' item, sized by height. Choose your "
                    "child's profile (or add one under Body Profile → Family) to get a size."
                )
            if (
                chart
                and profile.height_cm
                and (
                    from_chart := self._recommend_from_chart(
                        product, chart, {"height_cm": profile.height_cm}
                    )
                )
            ):
                return from_chart
            return self._recommend_kids(product, profile)
        if profile and is_kids_profile:
            raise ValidationAppError(
                f"This item is cut for adults, but {profile.name}'s profile is a child's. "
                "Choose an adult profile to get a size."
            )

        measurements = CATEGORY_MEASUREMENTS.get(product.category.lower())
        if measurements is None:
            raise ValidationAppError(
                f"Size recommendation isn't available for {product.category} yet."
            )

        values = {m: getattr(profile, m) for m in measurements if profile and getattr(profile, m)}
        if not values:
            needed = " / ".join(MEASUREMENT_LABELS[m] for m in measurements)
            raise ValidationAppError(
                f"Add your {needed} measurements to your body profile to get a size recommendation."
            )

        stocked_labels = [v.size_label for v in product.variants]
        shape = (profile.body_shape if profile else None) or ""
        if chart and (from_chart := self._recommend_from_chart(product, chart, values)):
            tip = SHAPE_TIPS.get((shape, product.category.lower()))
            return (
                replace(from_chart, fit_note=f"{from_chart.fit_note} {tip}") if tip else from_chart
            )
        if stocked_labels and all(label.strip().isdigit() for label in stocked_labels):
            result = self._recommend_numeric_waist(product, stocked_labels, values)
            tip = WAIST_SIZED_TIPS.get(shape)
        else:
            result = self._recommend_alpha(product, stocked_labels, values)
            tip = SHAPE_TIPS.get((shape, product.category.lower()))
        return replace(result, fit_note=f"{result.fit_note} {tip}") if tip else result

    def _recommend_from_chart(
        self, product: Product, chart: SizeChart, values: dict[str, float]
    ) -> SizeRecommendation | None:
        """Sizes against the brand's chart; None when the chart can't be used
        (none of these measurements in it, or its labels match no stocked size)."""
        rows = chart.rows
        usable = [m for m in values if any(m in row for row in rows)]
        if not usable:
            return None

        def index_for(measurement: str, value: float) -> tuple[int, bool]:
            ranges = [(i, row[measurement]) for i, row in enumerate(rows) if measurement in row]
            for index, (low, high) in ranges:
                if value <= high:
                    return index, value >= low
            return ranges[-1][0], False

        ideal = {m: index_for(m, values[m]) for m in usable}
        indices = [index for index, _ in ideal.values()]
        target = max(indices)

        stocked = {v.size_label.strip().upper(): v.size_label for v in product.variants}
        available = {
            i: stocked[row["size_label"].upper()]
            for i, row in enumerate(rows)
            if row["size_label"].upper() in stocked
        }
        if not available:
            return None
        chosen = min(available, key=lambda index: (abs(index - target), -index))
        label = available[chosen]

        confidence = 0.95
        confidence -= 0.15 * (max(indices) - min(indices))
        confidence -= 0.2 * abs(chosen - target)
        confidence -= 0.1 * sum(1 for _, inside in ideal.values() if not inside)

        brand = product.store.name
        if chosen > target:
            note = f"Your exact size isn't stocked, so {label} will fit a little loose."
        elif chosen < target:
            note = f"Your exact size isn't stocked, so {label} may fit snug."
        else:
            note = f"Your measurements match {label} on {brand}'s size chart."
        return SizeRecommendation(
            product.id, label, round(max(0.3, confidence), 2), note, size_chart="brand"
        )

    def _apply_fit_feedback(
        self, product: Product, chart: SizeChart | None, result: SizeRecommendation
    ) -> SizeRecommendation:
        summary = FitFeedbackService(self.db).summarize(product.id)
        result = replace(result, fit_feedback=summary)
        runs = summary.runs
        if runs not in ("small", "large"):
            return result

        if chart:
            chart_order = {row["size_label"].upper(): i for i, row in enumerate(chart.rows)}
            labels = sorted(
                (v.size_label for v in product.variants),
                key=lambda label: chart_order.get(label.strip().upper(), len(chart_order)),
            )
        else:
            labels = sorted((v.size_label for v in product.variants), key=_standard_size_key)
        if result.recommended_size_label not in labels:
            return result

        agreeing = summary.small if runs == "small" else summary.large
        said = f"{agreeing} of {summary.reports} shoppers say this runs {runs}"
        index = labels.index(result.recommended_size_label) + (1 if runs == "small" else -1)
        if 0 <= index < len(labels):
            direction = "up" if runs == "small" else "down"
            return replace(
                result,
                recommended_size_label=labels[index],
                fit_note=f"{result.fit_note} {said}, so we went one size {direction}.",
            )
        edge = "largest" if runs == "small" else "smallest"
        return replace(result, fit_note=f"{result.fit_note} {said} — {edge} size already.")

    def _recommend_kids(self, product: Product, profile: BodyProfile) -> SizeRecommendation:
        if product.category.lower() not in CATEGORY_MEASUREMENTS:
            raise ValidationAppError(
                f"Size recommendation isn't available for {product.category} yet."
            )
        if not profile.height_cm:
            raise ValidationAppError(
                "Add your child's height to the body profile to get a size recommendation."
            )

        sizes: list[tuple[int, str]] = []
        for variant in product.variants:
            match = KIDS_LABEL.fullmatch(variant.size_label.strip().lower())
            if not match:
                continue
            upper = int(match.group(2) or match.group(1))
            max_height = upper if upper >= 80 else KIDS_AGE_MAX_HEIGHT_CM.get(upper)
            if max_height:
                sizes.append((max_height, variant.size_label))
        if not sizes:
            raise ValidationAppError("This product's sizes don't follow a kids' size chart.")
        sizes.sort()

        height = profile.height_cm
        index = next((i for i, (max_h, _) in enumerate(sizes) if max_h >= height), len(sizes) - 1)
        confidence = 0.9 if sizes[index][0] >= height else 0.5
        note = f"Sized for a height of {height:.0f} cm."

        if profile.body_shape in KIDS_SIZE_UP_FITS:
            if index + 1 < len(sizes):
                index += 1
                note += f" Went one size up for a {profile.body_shape} fit."
            else:
                confidence -= 0.1
                note += f" This is the largest size — a {profile.body_shape} fit may feel snug."
        elif profile.body_shape == "slim":
            note += " A slim build may prefer an adjustable waist."

        if sizes[-1][0] < height:
            note = f"Your child is taller than this product's largest size ({sizes[-1][1]})."
        return SizeRecommendation(product.id, sizes[index][1], round(max(0.3, confidence), 2), note)

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
