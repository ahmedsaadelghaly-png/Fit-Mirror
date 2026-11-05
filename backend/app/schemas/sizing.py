import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.sizing import FitVerdict

Range = tuple[float, float]


class SizeChartRow(BaseModel):
    size_label: str = Field(min_length=1, max_length=50)
    chest_cm: Range | None = None
    waist_cm: Range | None = None
    hip_cm: Range | None = None
    height_cm: Range | None = None


class SizeChartUpsert(BaseModel):
    """Either structured `rows` or a pasted/uploaded `csv` (see
    app/services/size_chart_service.py for the CSV format)."""

    rows: list[SizeChartRow] | None = None
    csv: str | None = Field(default=None, max_length=20_000)

    @model_validator(mode="after")
    def exactly_one_source(self) -> "SizeChartUpsert":
        if (self.rows is None) == (self.csv is None):
            raise ValueError("Send either 'rows' or 'csv'.")
        return self


class SizeChartRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    category: str
    rows: list[SizeChartRow]
    updated_at: datetime


class FitFeedbackCreate(BaseModel):
    product_id: uuid.UUID
    size_label: str = Field(min_length=1, max_length=50)
    fit: FitVerdict


class FitSummaryRead(BaseModel):
    reports: int
    small: int
    true_to_size: int
    large: int
    runs: str | None
