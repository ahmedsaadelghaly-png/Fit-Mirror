"""
Per-brand size charts: validation, CSV ingestion, and lookup.

CSV format (header row required; columns in any order; units are cm):

    size,chest,waist,hip,height
    S,86-94,70-78,92-98,
    M,94-102,78-86,98-104,

`size` is required plus at least one measurement column. Each cell is a
range "min-max" (an en dash also works); blank cells are fine. Rows go
smallest size first, as a shopper would read the chart.
"""

import csv
import io
import re
import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import ValidationAppError
from app.models.sizing import SizeChart

MEASUREMENTS = ("chest_cm", "waist_cm", "hip_cm", "height_cm")
# Garment categories the sizing engine can size (footwear/accessories can't).
SIZED_CATEGORIES = ("tops", "outerwear", "dresses", "bottoms")
MAX_ROWS = 30

_HEADER_ALIASES = {
    "size": "size_label",
    "size_label": "size_label",
    **{name: f"{name}_cm" for name in ("chest", "waist", "hip", "height")},
    **{f"{name}_cm": f"{name}_cm" for name in ("chest", "waist", "hip", "height")},
}
_RANGE = re.compile(r"^\s*(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*$")


def parse_csv(text: str) -> list[dict]:
    reader = csv.reader(io.StringIO(text.strip()))
    try:
        header = [cell.strip().lower() for cell in next(reader)]
    except StopIteration as exc:
        raise ValidationAppError("The size chart CSV is empty.") from exc
    columns = [_HEADER_ALIASES.get(name) for name in header]
    if "size_label" not in columns:
        raise ValidationAppError("The size chart CSV needs a 'size' column.")
    unknown = [name for name, column in zip(header, columns, strict=True) if column is None]
    if unknown:
        raise ValidationAppError(
            f"Unknown column(s) {', '.join(unknown)}. Use: size, chest, waist, hip, height (cm)."
        )

    rows = []
    for line_number, cells in enumerate(reader, start=2):
        if not any(cell.strip() for cell in cells):
            continue
        row: dict = {}
        for column, cell in zip(columns, cells, strict=False):
            cell = cell.strip()
            if not cell:
                continue
            if column == "size_label":
                row["size_label"] = cell
                continue
            match = _RANGE.match(cell)
            if not match:
                raise ValidationAppError(
                    f"Line {line_number}: '{cell}' isn't a range like 86-94 (cm)."
                )
            row[column] = [float(match.group(1)), float(match.group(2))]
        rows.append(row)
    return rows


def validate_rows(rows: list[dict]) -> list[dict]:
    if not rows:
        raise ValidationAppError("A size chart needs at least one size.")
    if len(rows) > MAX_ROWS:
        raise ValidationAppError(f"A size chart can have at most {MAX_ROWS} sizes.")
    clean, seen = [], set()
    for row in rows:
        label = str(row.get("size_label") or "").strip()
        if not label:
            raise ValidationAppError("Every row needs a size label.")
        if label.upper() in seen:
            raise ValidationAppError(f"Size '{label}' appears twice.")
        seen.add(label.upper())
        entry: dict = {"size_label": label}
        for measurement in MEASUREMENTS:
            value = row.get(measurement)
            if value is None:
                continue
            low, high = (float(v) for v in value)
            if not 20 <= low < high <= 250:
                raise ValidationAppError(
                    f"Size {label}: {measurement.removesuffix('_cm')} range {low:g}-{high:g} "
                    "must go from low to high, in cm."
                )
            entry[measurement] = [low, high]
        if len(entry) == 1:
            raise ValidationAppError(f"Size {label} has no measurements.")
        clean.append(entry)
    return clean


class SizeChartService:
    def __init__(self, db: Session):
        self.db = db

    def list_for_store(self, store_id: uuid.UUID) -> list[SizeChart]:
        return (
            self.db.query(SizeChart)
            .filter(SizeChart.store_id == store_id)
            .order_by(SizeChart.category)
            .all()
        )

    def get(self, store_id: uuid.UUID, category: str) -> SizeChart | None:
        return (
            self.db.query(SizeChart)
            .filter(SizeChart.store_id == store_id, SizeChart.category == category.lower())
            .first()
        )

    def upsert(self, store_id: uuid.UUID, category: str, rows: list[dict]) -> SizeChart:
        category = category.lower()
        if category not in SIZED_CATEGORIES:
            raise ValidationAppError(
                f"Size charts are for {', '.join(SIZED_CATEGORIES)} — not '{category}'."
            )
        rows = validate_rows(rows)
        chart = self.get(store_id, category)
        if chart:
            chart.rows = rows
        else:
            chart = SizeChart(store_id=store_id, category=category, rows=rows)
            self.db.add(chart)
        self.db.commit()
        self.db.refresh(chart)
        return chart
