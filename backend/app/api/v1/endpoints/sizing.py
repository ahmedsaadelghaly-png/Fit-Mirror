"""
Size Recommendation endpoints.

Backed by the rule-based SizingService (BodyProfile measurements matched
against a standard size chart, restricted to the product's stocked sizes).
"""

import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user_id, get_db
from app.schemas.sizing import FitFeedbackCreate, FitSummaryRead
from app.services.fit_feedback_service import FitFeedbackService, FitSummary
from app.services.sizing_service import SizingService

router = APIRouter()


class SizeRecommendationRequest(BaseModel):
    product_id: uuid.UUID
    # Whose size: one of the caller's family profiles. Defaults to their own.
    body_profile_id: uuid.UUID | None = None


class SizeRecommendationResponse(BaseModel):
    product_id: uuid.UUID
    recommended_size_label: str
    confidence: float
    fit_note: str
    body_profile_id: uuid.UUID | None
    profile_name: str | None
    # "brand": the brand's own size chart was used; "standard": ours.
    size_chart: str
    # What shoppers say about this product's fit (runs is set once enough agree).
    fit_feedback: FitSummaryRead | None


def _summary(summary: FitSummary | None) -> FitSummaryRead | None:
    return FitSummaryRead(**summary.__dict__, runs=summary.runs) if summary else None


@router.post("/recommend", response_model=SizeRecommendationResponse)
def recommend_size(
    payload: SizeRecommendationRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    result = SizingService(db).recommend(
        uuid.UUID(user_id), payload.product_id, payload.body_profile_id
    )
    return SizeRecommendationResponse(
        product_id=result.product_id,
        recommended_size_label=result.recommended_size_label,
        confidence=result.confidence,
        fit_note=result.fit_note,
        body_profile_id=result.body_profile_id,
        profile_name=result.profile_name,
        size_chart=result.size_chart,
        fit_feedback=_summary(result.fit_feedback),
    )


@router.post("/feedback", response_model=FitSummaryRead)
def report_fit(
    payload: FitFeedbackCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """ "How does it fit?" — one verdict per shopper per product (sending
    again replaces it). Returns the product's updated fit summary."""
    summary = FitFeedbackService(db).record(
        uuid.UUID(user_id), payload.product_id, payload.size_label, payload.fit
    )
    return _summary(summary)
